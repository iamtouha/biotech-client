<template>
  <q-page class="container">
    <filter-panel
      ref="filterPanel"
      :loading="loading"
      @run-query="reloadInvoices"
      @refresh="refreshData"
      @filter-items="setFilter"
    >
    </filter-panel>
    <q-table
      class="no-shadow"
      dense
      :fullscreen.sync="fullscreen"
      :loading="$apollo.loading"
      :title="$t('invoices')"
      :columns="invColumns"
      :data="filter"
      virtual-scroll
      :rows-per-page-options="[10, 20, 40, 0]"
      @row-click="openInv"
    >
      <template v-slot:top-right>
        <q-btn
          size="sm"
          color="primary"
          :icon="fullscreen ? 'close_fullscreen' : 'open_in_full'"
          @click="fullscreen = !fullscreen"
        ></q-btn>
        <q-btn size="sm" color="primary" class="q-ml-sm" icon="archive" no-caps>
          <q-menu>
            <q-list style="min-width:130px;">
              <q-item @click="exportTable" clickable>
                <q-item-section>Export to csv</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </template>
      <template v-slot:bottom-row>
        <q-tr>
          <q-th colspan="2"></q-th>
          <q-th class="text-right">{{ $n(count.cash) }}{{ $t("tk") }}</q-th>
          <q-th class="text-right">{{ $n(count.credit) }}{{ $t("tk") }}</q-th>
          <q-th class="text-right">
            Total {{ $n(count.cash + count.credit) }}{{ $t("tk") }}
          </q-th>
          <q-th></q-th>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { exportFile } from "quasar";
import Invoices from "src/apollo/queries/invoices.gql";
import FilterPanel from "components/FilterPanel";

export default {
  name: "Invoices",
  components: {
    FilterPanel
  },
  data() {
    const variables = this.getVariables();
    return {
      tab: "orders",
      fullscreen: false,
      loading: false,
      invoices: [],
      dealers: [],
      dealer: null,
      variables,
      filterParams: {
        field: "dealer",
        values: []
      },
      invColumns: [
        {
          name: "index",
          sortable: true,
          label: "#",
          field: "index"
        },
        {
          name: "dealer",
          label: this.$t("dealer"),
          field: row => row.dealer.name,
          align: "left",
          sortable: true
        },
        {
          name: "cash",
          sortable: true,
          sort: (a, b, rA, rB) => rA.cash_total - rB.cash_total,
          label: this.$t("total-cash"),
          field: v => this.$n(v.cash_total)
        },
        {
          name: "credit",
          sortable: true,
          sort: (a, b, rA, rB) => rA.credit_total - rB.credit_total,
          label: this.$t("total-credit"),
          field: v => this.$n(v.credit_total)
        },
        {
          name: "date",
          sortable: true,
          sort: (a, b, rA, rB) => {
            const d1 = new Date(rA.confirmed_at).getTime();
            const d2 = new Date(rB.confirmed_at).getTime();
            return d1 - d2;
          },
          label: this.$t("date"),
          field: row => this.$dt(row.confirmed_at, this.$i18n.locale)
        },
        {
          name: "officer",
          sortable: true,
          label: this.$t("officer"),
          field: row => row.officer.name
        }
      ]
    };
  },

  computed: {
    post() {
      return this.$store.getters["user/em"].post;
    },
    count() {
      return this.filter.reduce(
        (acc, inv) => {
          acc.cash += inv.cash_total;
          acc.credit += inv.credit_total;
          return acc;
        },
        { cash: 0, credit: 0 }
      );
    },
    filter() {
      const { field, values } = this.filterParams;
      if (!field || !values.length) return this.invoices;
      if (field === "dealer") {
        return this.invoices.filter(inv => values.includes(inv.dealer.id));
      } else if (field === "officer") {
        return this.invoices.filter(inv => values.includes(inv.officer.id));
      } else if (field === "area_manager") {
        return this.invoices.filter(inv => values.includes(inv.officer.am.id));
      } else if (field === "regional_sales_manager") {
        return this.invoices.filter(inv => values.includes(inv.officer.rsm.id));
      }
      return [];
    }
  },
  apollo: {
    invoices: {
      query: Invoices,
      variables() {
        return { data: this.variables };
      },
      error(error) {
        this.$showError(error);
      }
    }
  },

  methods: {
    reloadInvoices() {
      this.variables = this.getVariables();
    },
    refreshData() {
      this.$apollo.queries.invoices?.refresh();
    },
    setFilter(val) {
      this.filterParams = val;
    },
    getVariables() {
      const range = this.$refs.filterPanel?.dateRange();
      const date1 = new Date();
      const date2 = new Date();
      date1.setDate(1);
      date2.setHours(23, 59, 59);

      const variables = {
        confirmed_at_gte: range?.from || date1,
        confirmed_at_lte: range?.to || date2,
        confirmed: true
      };
      const em = this.$store.getters["user/em"];
      if (em.post === "officer") variables.officer = em.id;
      else if (em.post === "area_manager") variables.officer = { am: em.id };
      else if (em.post === "regional_sales_manager")
        variables.officer = { rsm: em.id };
      else if (em.post === "director") variables.officer = { md: em.id };
      return variables;
    },
    openInv(_, row) {
      this.$router.push("/invoices/" + row.id);
    },
    exportTable() {
      // naive encoding to csv format
      const content = [this.invColumns.map(col => wrapCsvValue(col.label))]
        .concat(
          this.invoices.map(row =>
            this.invColumns
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
