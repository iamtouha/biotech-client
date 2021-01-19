<template>
  <q-page>
    <div class="q-pa-md">
      <q-tabs align="left" v-model="tab">
        <q-tab name="confirmed" label="Confirmed"></q-tab>
        <q-tab
          name="pending"
          :disable="!(post === 'area_manager' || post === 'officer')"
          :label="`pending (${pendingTxns.length})`"
        ></q-tab>
      </q-tabs>
      <q-tab-panels v-model="tab">
        <q-tab-panel name="confirmed">
          <q-table
            dense
            class="no-shadow"
            :loading="$apollo.loading"
            :data="confirmedTxns"
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
          </q-table>
        </q-tab-panel>
        <q-tab-panel name="pending">
          <div v-if="post === 'officer'" class="row shadow-2 q-pa-sm q-mb-md">
            <div class="col-12 col-sm-6 q-pa-sm">
              <q-select
                filled
                style="min-width:270px;"
                :options="dealers"
                v-model="dealer"
                option-label="name"
                :label="$t('select-dealer')"
              ></q-select>
            </div>
            <div class="col-12 col-sm-6 q-pa-sm">
              <q-input filled v-model="summary" :label="$t('summary')" />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-input
                filled
                v-model="amount"
                type="number"
                :label="$t('amount')"
              />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-input
                filled
                v-model="mr_no"
                type="number"
                :label="$t('receipt_no')"
              />
            </div>
            <div class="col-6 col-sm-4 q-pa-sm">
              <q-btn class="q-mt-sm" outline color="primary">
                {{ $t("date") }}: {{ $dt(date, $i18n.locale) }}
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
                      <q-btn label="Close" color="primary" flat v-close-popup />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-btn>
            </div>

            <div class="col-12 q-pa-sm">
              <q-btn
                :loading="loading"
                @click="createTxn"
                class="float-right bg-accent"
                :label="$t('add-to-list')"
              />
            </div>
          </div>
          <q-table
            :loading="$apollo.loading"
            class="no-shadow"
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

export default {
  name: "Transactions",
  data() {
    return {
      tab: "confirmed",
      fullscreen: false,
      tableActionOn: false,
      loading: false,
      dealers: [],
      dealer: null,
      amount: 0,
      mr_no: "",
      summary: "",
      date: this.$moment().format("YYYY-MM-DD"),
      transactions: [],
      confirmedHeaders: [
        { label: this.$t("receipt_no"), field: "mr_no" },
        { label: this.$t("dealer"), field: v => v.dealer.name, align: "left" },
        {
          label: this.$t("amount"),
          field: v => `${this.$n(v.amount)}${this.$t("tk")}`
        },
        { label: this.$t("summary"), field: "summary", align: "left" },
        { label: this.$t("officer"), field: v => v.officer.name },
        {
          label: this.$t("date"),
          field: v => this.$dt(v.date, this.$i18n.locale)
        }
      ],
      pendingHeaders: [
        { label: this.$t("receipt_no"), field: "mr_no" },
        { label: this.$t("dealer"), field: v => v.dealer.name, align: "left" },
        {
          label: this.$t("amount"),
          field: v => `${this.$n(v.amount)}${this.$t("tk")}`
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
    confirmedTxns() {
      return this.transactions.filter(txn => txn.confirmed);
    },
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
    post() {
      return this.$store.getters["user/em"].post;
    }
  },
  apollo: {
    transactions: {
      fetchPolicy: "network-only",
      query: Transactions,
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
      const { dealer, amount, summary, mr_no, date } = this;
      try {
        if (!dealer || !amount || !mr_no) throw new Error("Incomplete Input");
        const resp = await this.$apollo.mutate({
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
        this.transactions.push(resp.data.createTransaction.transaction);
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
          this.confirmedTxns.map(row =>
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
