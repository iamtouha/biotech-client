<template>
  <q-page>
    <div class="q-px-md q-pa-sm">
      <q-tabs align="left" class="print-hide" v-model="tab">
        <q-tab
          name="orders"
          :label="`${$t('orders')} (${pendingInv.length})`"
        />
        <q-tab name="invoices" :label="$t('invoices')" />
      </q-tabs>

      <q-tab-panels v-model="tab">
        <q-tab-panel name="invoices">
          <q-table
            class="no-shadow"
            dense
            :fullscreen.sync="fullscreen"
            :loading="$apollo.loading"
            :title="$t('invoices')"
            :columns="invColumns"
            :style="{ height: fullscreen ? '100vh' : 'calc(100vh - 180px)' }"
            :data="confirmedInv"
            virtual-scroll
            :rows-per-page-options="[0]"
            @row-click="openInv"
          >
            <template v-slot:top-right>
              <q-btn
                size="sm"
                color="primary"
                :icon="fullscreen ? 'close_fullscreen' : 'open_in_full'"
                @click="fullscreen = !fullscreen"
              ></q-btn>
              <q-btn
                size="sm"
                color="primary"
                class="q-ml-sm"
                icon="archive"
                no-caps
              >
                <q-menu>
                  <q-list style="min-width:130px;">
                    <q-item @click="exportTable" clickable>
                      <q-item-section>Export to csv</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </template>
          </q-table>
        </q-tab-panel>
        <q-tab-panel name="orders">
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
            :columns="orderColumns"
            :data="pendingInv"
            @row-click="openInv"
          >
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
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
      invColumns: [
        { label: "#", field: "index" },
        {
          label: this.$t("dealer"),
          field: row => row.dealer.name,
          align: "left"
        },
        {
          label: this.$t("total-cash"),
          field: v => `${this.$n(v.cash_total)}${this.$t("tk")}`
        },
        {
          label: this.$t("total-credit"),
          field: v => `${this.$n(v.credit_total)}${this.$t("tk")}`
        },
        {
          label: this.$t("date"),
          field: row => this.$dt(row.confirmed_at, this.$i18n.locale)
        },
        { label: this.$t("officer"), field: row => row.officer.name }
      ],
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
    },
    dealers: {
      query: Dealers,
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
    confirmedInv() {
      return this.invoices.filter(inv => inv.confirmed === true);
    },
    pendingInv() {
      return this.invoices.filter(inv => inv.confirmed === false);
    },
    variables() {
      const em = this.$store.getters["user/em"];
      if (em.post === "officer") return { officer: em.id };
      else if (em.post === "area_manager") return { officer: { am: em.id } };
      else if (em.post === "regional_sales_manager")
        return { officer: { rsm: em.id }, confirmed: true };
      else if (em.post === "director")
        return { officer: { md: em.id }, confirmed: true };
      return {};
    }
  },
  created() {
    if (!["area_manager", "officer"].includes(this.post)) {
      this.tab = "invoices";
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
