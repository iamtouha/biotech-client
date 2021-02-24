<template>
  <q-page class="container">
    <div v-if="post === 'officer'" class="q-pa-md d-flex newInvInit">
      <q-select
        filled
        style="min-width:270px;"
        :options="dealers"
        v-model="dealer"
        option-label="name"
        :label="$t('select-dealer')"
      ></q-select>
      <q-btn
        :disable="!dealer"
        :loading="newInvLoading"
        @click="createInvoice"
        color="primary"
        class="q-ml-sm"
        icon-right="note_add"
      />
    </div>
    <q-table
      :title="$t('orders')"
      class="no-shadow"
      :loading="$apollo.loading"
      :rows-per-page-options="[10, 20, 0]"
      :columns="orderColumns"
      :data="invoices"
      @row-click="openInv"
    >
    </q-table>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
import { exportFile } from "quasar";
import Invoices from "src/apollo/queries/invoices.gql";
import Dealers from "src/apollo/queries/dealers.gql";

export default {
  name: "Invoices",
  data() {
    return {
      tab: "orders",
      fullscreen: false,
      newInvLoading: false,
      invoices: [],
      dealers: [],
      dealer: null,

      orderColumns: [
        { label: "#", field: "index" },
        {
          label: this.$t("dealer"),
          field: row => row.dealer.name,
          align: "left"
        },
        {
          label: this.$t("order-date"),
          field: row => this.$dt(row.createdAt, this.$i18n.locale)
        },
        { label: this.$t("officer"), field: row => row.officer.name }
      ]
    };
  },
  apollo: {
    invoices: {
      query: Invoices,
      fetchPolicy: "network-only",
      variables() {
        return {
          data: this.variables
        };
      },
      error(error) {
        this.$showError(error);
      }
    }
  },
  computed: {
    post() {
      return this.$store.getters["user/em"].post;
    },

    variables() {
      const em = this.$store.getters["user/em"];
      if (em.post === "officer") return { officer: em.id, confirmed: false };
      else if (em.post === "area_manager")
        return { officer: { am: em.id }, confirmed: false };
      else if (em.post === "regional_sales_manager")
        return { officer: { rsm: em.id }, confirmed: false };
      else if (em.post === "director")
        return { officer: { md: em.id }, confirmed: false };
      return {};
    }
  },
  created() {
    if (this.post === "officer") {
      const em = this.$store.getters["user/em"];
      this.$apollo
        .query({
          query: Dealers,
          variables: { data: { officer: em.id } }
        })
        .then(({ data }) => {
          this.dealers = data.dealers;
        })
        .catch(err => this.$showError(err));
    }
  },
  methods: {
    openInv(_, row) {
      this.$router.push("/invoices/" + row.id);
    },
    exportTable() {
      // naive encoding to csv format
      const content = [this.columns.map(col => wrapCsvValue(col.label))]
        .concat(
          this.confirmedInv.map(row =>
            this.columns
              .map(col =>
                wrapCsvValue(
                  typeof col.field === "function"
                    ? col.field(row)
                    : row[col.field === void 0 ? col.name : col.field],
                  col.format
                )
              )
              .join(",")
          )
        )
        .join("\r\n");

      const status = exportFile("table-export.csv", content, "text/csv");

      if (status !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning"
        });
      }
    },
    createInvoice: async function() {
      this.newInvLoading = true;
      try {
        const response = await this.$apollo.mutate({
          mutation: gql`
            mutation($dealer: ID!, $officer: ID!) {
              createInvoice(
                input: { data: { dealer: $dealer, officer: $officer } }
              ) {
                invoice {
                  id
                }
              }
            }
          `,
          variables: {
            dealer: this.dealer.id,
            officer: this.$store.getters["user/em"].id
          }
        });
        const id = response.data.createInvoice.invoice.id;
        this.$router.push("/invoices/" + id);
      } catch (error) {
        this.$showError(error);
      }
      this.newInvLoading = false;
    }
  }
};
function wrapCsvValue(val, formatFn) {
  let formatted = formatFn !== void 0 ? formatFn(val) : val;

  formatted =
    formatted === void 0 || formatted === null ? "" : String(formatted);

  formatted = formatted.split('"').join('""');
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`;
}
</script>
<style lang="scss" scoped>
.newInvInit {
  display: flex;
  align-items: stretch;

  justify-content: center;
}
</style>
