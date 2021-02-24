<template>
  <q-page>
    <div class="q-pa-md">
      <q-tabs align="left" v-model="tab">
        <q-tab
          name="pending"
          :disable="!(post === 'area_manager' || post === 'officer')"
          :label="`pending (${pendingTxns.length})`"
        ></q-tab>
        <q-tab name="confirmed" label="Confirmed"></q-tab>
      </q-tabs>
      <q-tab-panels v-model="tab">
        <q-tab-panel name="confirmed">
          <filter-panel
            ref="filterPanelTxn"
            @run-query="reloadTxns"
            @filter-items="setFilter"
          >
          </filter-panel>
          <q-table
            dense
            class="no-shadow"
            :loading="$apollo.loading"
            :rows-per-page-options="[6, 20, 40, 0]"
            :fullscreen.sync="fullscreen"
            :data="filter"
            :columns="confirmedHeaders"
            title="Confirmed Transactions"
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
            <template v-slot:body-cell-actions="props">
              <td style="text-align:center;" :props="props">
                <q-btn
                  v-if="post === 'area_manager'"
                  :disable="tableActionOn"
                  size="sm"
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click="
                    confirmDialog('Delete transaction?', delTxn, props.row.id)
                  "
                ></q-btn>
                <span v-else>-</span>
              </td>
            </template>
            <template v-slot:bottom-row>
              <q-tr>
                <q-th colspan="2"></q-th>
                <q-th class="text-right">
                  Total {{ $n(count) }}{{ $t("tk") }}
                </q-th>
                <q-th></q-th>
              </q-tr>
            </template>
          </q-table>
        </q-tab-panel>
        <q-tab-panel name="pending">
          <div v-if="post === 'officer'" class="row shadow-2 q-pa-sm q-mb-md">
            <div class="col-12 col-sm-6 q-pa-sm">
              <q-select
                filled
                style="min-width:270px;"
                :options="dealers"
                v-model="txn.dealer"
                option-label="name"
                :label="$t('select-dealer')"
              ></q-select>
            </div>
            <div class="col-12 col-sm-6 q-pa-sm">
              <q-input filled v-model="txn.summary" :label="$t('summary')" />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-input
                filled
                v-model="txn.amount"
                type="number"
                :label="$t('amount')"
              />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-input
                filled
                v-model="txn.mr_no"
                type="number"
                :label="$t('receipt_no')"
              />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-btn class="q-mt-sm" outline color="primary">
                {{ $t("date") }}: {{ $dt(txn.date, $i18n.locale) }}
                <q-popup-proxy transition-show="scale" transition-hide="scale">
                  <q-date
                    emit-immediately
                    navigation-min-year-month="2015/01"
                    :first-day-of-week="6"
                    mask="YYYY-MM-DD"
                    minimal
                    v-model="date"
                  >
                    <div class="row items-center justify-end q-gutter-sm">
                      <q-btn
                        label="Cancel"
                        @click="date = txn.date"
                        flat
                        v-close-popup
                      />
                      <q-btn
                        label="Okay"
                        @click="txn.date = date"
                        color="primary"
                        flat
                        v-close-popup
                      />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-btn>
            </div>

            <div class="col-12 q-pa-sm">
              <q-btn
                :loading="loading"
                :disable="!valid"
                class="float-right bg-accent"
                :label="$t('add-to-list')"
                @click="createTxn"
              />
            </div>
          </div>
          <q-table
            :loading="$apollo.loading"
            class="no-shadow"
            :rows-per-page-options="[10, 20, 40, 0]"
            color="q-ml-sm"
            :data="pendingTxns"
            :columns="pendingHeaders"
          >
            <template v-slot:body-cell-actions="props">
              <q-td :props="props">
                <q-btn
                  :disable="tableActionOn"
                  size="sm"
                  round
                  flat
                  color="negative"
                  icon="delete"
                  @click="
                    confirmDialog('Delete transaction?', delTxn, props.row.id)
                  "
                ></q-btn>
                <q-btn
                  v-if="post === 'area_manager'"
                  class="q-ml-sm"
                  :disable="tableActionOn"
                  size="sm"
                  round
                  flat
                  color="positive"
                  icon="done"
                  @click="
                    confirmDialog(
                      'Approve transaction?',
                      approveTxn,
                      props.row.id
                    )
                  "
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
import { exportFile } from "quasar";
import Dealers from "src/apollo/queries/dealers.gql";
import Transactions from "src/apollo/queries/txns.gql";
import FilterPanel from "components/FilterPanel";

export default {
  name: "Transactions",
  components: {
    FilterPanel
  },
  data() {
    const vars = this.getVariables();
    return {
      tab: "pending",
      fullscreen: false,
      tableActionOn: false,
      loading: false,

      txnVars: vars,
      filterParams: {
        field: "dealer",
        values: []
      },

      dealers: [],
      txn: {
        dealer: null,
        amount: 0,
        mr_no: "",
        summary: "",
        date: this.$moment().format("YYYY-MM-DD")
      },
      date: this.$moment().format("YYYY-MM-DD"),
      transactions: [],
      confirmedHeaders: [
        { label: this.$t("receipt_no"), field: "mr_no" },
        {
          name: "dealer",
          sortable: true,
          label: this.$t("dealer"),
          field: v => v.dealer.name,
          align: "left"
        },
        {
          name: "amount",
          sortable: true,
          sort: (a, b, rA, rB) => rA.amount - rB.amount,
          label: this.$t("amount"),
          field: v => this.$n(v.amount)
        },
        { label: this.$t("summary"), field: "summary", align: "left" },
        { label: this.$t("officer"), field: v => v.officer.name },
        {
          name: "date",
          sortable: true,
          sort: (a, b, rA, rB) => {
            const d1 = new Date(rA.date).getTime();
            const d2 = new Date(rB.date).getTime();
            return d1 - d2;
          },
          label: this.$t("date"),
          field: v => this.$dt(v.date, this.$i18n.locale)
        },
        { label: this.$t("actions"), name: "actions" }
      ],
      pendingHeaders: [
        { label: this.$t("receipt_no"), field: "mr_no" },
        { label: this.$t("dealer"), field: v => v.dealer.name, align: "left" },
        {
          label: this.$t("amount"),
          field: v => this.$n(v.amount)
        },
        { label: this.$t("summary"), field: "summary", align: "left" },
        { label: this.$t("officer"), field: v => v.officer.name },
        {
          label: this.$t("date"),
          field: v => this.$dt(v.date, this.$i18n.locale)
        },
        { label: this.$t("actions"), name: "actions" }
      ]
    };
  },
  computed: {
    pendingTxns() {
      return this.transactions.filter(txn => !txn.confirmed);
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
    },
    count() {
      return this.filter.reduce((acc, txn) => {
        acc += txn.amount;
        return acc;
      }, 0);
    },
    filter() {
      const txns = this.transactions.filter(txn => txn.confirmed);
      const { field, values } = this.filterParams;
      if (!field || !values.length) return txns;
      if (field === "dealer") {
        return txns.filter(inv => values.includes(inv.dealer.id));
      } else if (field === "officer") {
        return txns.filter(inv => values.includes(inv.officer.id));
      } else if (field === "area_manager") {
        return txns.filter(inv => values.includes(inv.officer.am.id));
      } else if (field === "regional_sales_manager") {
        return txns.filter(inv => values.includes(inv.officer.rsm.id));
      }
      return [];
    },
    valid() {
      const { dealer, amount, mr_no, date } = this.txn;
      return dealer?.id && amount && mr_no && date;
    },
    post() {
      return this.$store.getters["user/em"].post;
    }
  },
  apollo: {
    transactions: {
      fetchPolicy: "network-first",
      query: Transactions,
      variables() {
        return { data: this.txnVars };
      },
      error(error) {
        this.$showError(error);
      }
    },
    dealers: {
      query: Dealers,
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
  methods: {
    getVariables() {
      const range = this.$refs.filterPanelTxn?.dateRange();
      const date1 = new Date();
      const date2 = new Date();
      date1.setDate(1);
      date2.setHours(23, 59, 59);

      const variables = {
        date_gte: range?.from || date1,
        date_lte: range?.to || date2,
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
    reloadTxns() {
      this.txnVars = this.getVariables();
    },
    setFilter(val) {
      this.filterParams = val;
    },
    delTxn(id) {
      this.tableActionOn = true;
      this.$apollo
        .mutate({
          mutation: gql`
            mutation delTxn($id: ID!) {
              deleteTransaction(input: { where: { id: $id } }) {
                transaction {
                  id
                }
              }
            }
          `,
          variables: { id },
          update: () => {
            const idx = this.transactions.findIndex(txn => txn.id === id);
            this.transactions.splice(idx, 1);
          },
          error: error => {
            this.$showError(error);
          }
        })
        .finally(() => {
          this.tableActionOn = false;
        });
    },
    async approveTxn(id) {
      this.tableActionOn = true;
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation approveTxn($id: ID!, $data: editTransactionInput!) {
              updateTransaction(input: { where: { id: $id }, data: $data }) {
                transaction {
                  id
                }
              }
            }
          `,
          variables: {
            id,
            data: { confirmed: true }
          },
          error: this.$showError,
          update: data => {
            const trx = this.transactions.find(trx => trx.id === id);
            trx.confirmed = true;
          }
        });
      } catch (error) {
        this.$showError(error);
      }
      this.tableActionOn = false;
    },
    createTxn: async function() {
      this.loading = true;
      try {
        if (!this.valid) throw new Error("Incomplete Input");
        const { dealer, amount, mr_no, summary } = this.txn;

        const currentDate = new Date();
        const date = new Date(this.txn.date);
        date.setMinutes(currentDate.getMinutes());
        date.setHours(currentDate.getHours());

        const { data } = await this.$apollo.mutate({
          mutation: gql`
            mutation createTxn($data: TransactionInput!) {
              createTransaction(input: { data: $data }) {
                transaction {
                  id
                  dealer {
                    id
                    name
                  }
                  officer {
                    id
                    name
                  }
                  summary
                  mr_no
                  date
                  confirmed
                  amount
                }
              }
            }
          `,
          variables: {
            data: {
              dealer: dealer.id,
              officer: dealer.officer.id,
              summary,
              mr_no,
              date,
              amount: +amount
            }
          }
        });
        this.transactions.push(data.createTransaction.transaction);
        const newDate = this.$moment().format("YYYY-MM-DD");
        this.txn = {
          dealer: null,
          amount: 0,
          mr_no: "",
          summary: "",
          date: newDate
        };
        this.date = newDate;
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    },
    confirmDialog(message, callback, params = null) {
      this.$q
        .dialog({
          title: "Confirm",
          message,
          cancel: true
        })
        .onOk(v => {
          callback(params);
        });
    },
    exportTable() {
      // naive encoding to csv format
      const content = [this.columns.map(col => wrapCsvValue(col.label))]
        .concat(
          this.filter.map(row =>
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
