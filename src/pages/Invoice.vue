<template>
  <q-page>
    <div class="q-pa-md">
      <inv-header
        v-if="invoice"
        v-model="confirm_date"
        :editable="editable"
        :invoice="invoice"
      />
      <inv-item-input
        ref="invInput"
        v-if="editable && !readOnly"
        :loading="loading"
        @additem="createInvoiceItem"
      />
      <q-table
        dense
        flat
        hide-bottom
        :loading="$apollo.loading"
        :rows-per-page-options="[invoice ? invoice.items.length : 0]"
        :columns="columns"
        :data="invoice ? invoice.items : []"
      >
        <template v-slot:body-cell-actions="props">
          <q-td v-if="readOnly" class="text-right">
            _
          </q-td>
          <q-td v-else :props="props">
            <q-btn
              :disable="tableActionOn"
              size="sm"
              round
              color="info"
              icon="edit"
              class="q-mr-sm"
              @click="editItem(props.row)"
            />
            <q-btn
              :disable="tableActionOn"
              size="sm"
              round
              color="negative"
              icon="delete"
              @click="delItem(props.row.id)"
            />
          </q-td>
        </template>
        <template v-slot:bottom-row>
          <q-tr style="text-align:right;">
            <q-th colspan="2">{{ $t("total") }}</q-th>
            <q-th>{{ $n(summary.units) }} </q-th>
            <q-th> {{ $t("cash") }} {{ $n(summary.cash) }}{{ $t("tk") }} </q-th>
            <q-th
              >{{ $t("credit") }} {{ $n(summary.credit) }}{{ $t("tk") }}
            </q-th>
            <q-th>
              = {{ $n(summary.cash + summary.credit) }}{{ $t("tk") }}
            </q-th>
          </q-tr>

          <!-- invoice overview -->

          <invoice-overview
            v-if="invoice && invoice.confirmed"
            :dealerId="invoice.dealer.id"
            :date="invoice.confirm_date"
          />
          <!-- invoice overview end -->
        </template>
      </q-table>

      <div class="row q-mt-lg print-hide">
        <q-btn
          @click="confirmDialog($t('delete-order?'), dltInvoice)"
          v-if="
            post === 'area_manager' ||
              (post === 'officer' && invoice && !invoice.confirmed)
          "
          :disable="loading"
          color="negative"
          :label="$t('delete')"
        />
        <q-btn
          v-if="post === 'area_manager' && invoice && !invoice.confirmed"
          @click="confirmDialog($t('approve-order?'), confirmInvoice)"
          :loading="loading"
          :disable="invoice && !invoice.items.length"
          color="primary"
          class="q-ml-sm"
          :label="$t('confirm')"
        />
      </div>
      <div class="row print-only signature-area">
        <div class="col-4">
          <span>
            {{ $t("customer") }}
          </span>
        </div>
        <div class="col-4">
          <span>
            {{ $t("officer") }}
          </span>
        </div>
        <div class="col-4">
          <span>
            {{ $t("incharge") }}
          </span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import cloneDeep from "lodash.clonedeep";
import gql from "graphql-tag";
import CreateInvoiceItem from "src/apollo/mutations/createInvoiceItem.gql";
import Invoice from "src/apollo/queries/invoice.gql";
import InvItemInput from "components/InvItemInput";
import InvHeader from "components/InvoiceHeader";
import InvoiceOverview from "components/InvoiceOverview";

export default {
  name: "Invoice",
  components: { InvItemInput, InvHeader, InvoiceOverview },
  data() {
    return {
      loading: false,
      tableActionOn: false,
      invoice: null,
      confirm_date: "",
      headers: [
        {
          label: this.$t("product"),
          align: "left",
          field: v => v.pack.product.name
        },
        {
          label: this.$t("pack"),
          align: "left",
          field: v => v.pack.size
        },
        { label: this.$t("units"), field: v => this.$n(v.units) },
        {
          label: this.$t("rate"),
          field: v => `${this.$n(v.rate)}${this.$t("tk")}`
        },
        { label: this.$t("type"), field: v => this.$t(v.type) },
        {
          label: this.$t("total"),
          field: v => `${this.$n(v.rate * v.units)}${this.$t("tk")}`
        },

        { label: this.$t("actions"), name: "actions", field: "actions" }
      ]
    };
  },
  computed: {
    summary() {
      if (!this.invoice) return { cash: 0, credit: 0, units: 0 };
      const sum = this.invoice.items.reduce(
        (acc, pack) => {
          const { rate, units, type } = pack;
          if (type === "cash") acc.cash += rate * units;
          else if (type === "credit") acc.credit += rate * units;
          else throw new Error("Unknown type");
          acc.units += units;
          return acc;
        },
        {
          cash: 0,
          credit: 0,
          units: 0
        }
      );
      return sum;
    },
    post() {
      return this.$store.getters["user/em"]?.post;
    },
    readOnly() {
      const post = this.$store.getters["user/em"].post;
      return !(post === "officer" || post === "area_manager");
    },
    hideButton() {
      return !this.invoice || this.invoice?.confirmed || this.readOnly;
    },
    columns() {
      const columns = cloneDeep(this.headers);
      if (!this.editable) columns.pop();
      return columns;
    },
    editable() {
      if (!this.invoice || this.invoice?.confirmed) return false;
      return true;
    }
  },

  apollo: {
    invoice: {
      query: Invoice,
      fetchPolicy: "network-only",
      variables() {
        return { id: this.$route.params.id };
      },
      error(error) {
        this.$showError(error);
      }
    }
  },

  methods: {
    createInvoiceItem: async function(item) {
      try {
        this.loading = true;
        const { pack, units, type, rate } = item;
        const { data } = await this.$apollo.mutate({
          mutation: CreateInvoiceItem,
          variables: {
            input: {
              data: { pack, units, type, rate, invoice: this.invoice.id }
            }
          }
        });
        this.invoice.items.push(data.createInvoiceItem?.invoiceItem);
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    },
    editItem: async function(item) {
      try {
        await this.delItem(item.id);
        this.$refs.invInput.updateItem(item);
      } catch (error) {
        this.$showError(error);
      }
    },
    delItem: async function(id) {
      try {
        this.tableActionOn = true;
        await this.$apollo.mutate({
          mutation: gql`
            mutation($id: ID!) {
              deleteInvoiceItem(input: { where: { id: $id } }) {
                invoiceItem {
                  id
                }
              }
            }
          `,
          variables: { id }
        });
        const index = this.invoice.items.findIndex(it => it.id === id);
        if (index >= 0) this.invoice.items.splice(index, 1);
      } catch (error) {
        this.$showError(error);
      }
      this.tableActionOn = false;
    },
    confirmDialog(message, callback) {
      this.$q
        .dialog({
          title: this.$t("confirm"),
          message,
          cancel: true
        })
        .onOk(v => {
          callback().then(() => {
            this.$router.push("/invoices");
          });
        });
    },
    confirmInvoice: async function() {
      this.loading = true;
      try {
        const data = {
          confirm_date: this.confirm_date,
          cash_total: this.summary.cash,
          credit_total: this.summary.credit,
          confirmed: true
        };
        await this.$apollo.mutate({
          mutation: gql`
            mutation confirmInv($id: ID!, $data: editInvoiceInput!) {
              updateInvoice(input: { where: { id: $id }, data: $data }) {
                invoice {
                  id
                }
              }
            }
          `,
          variables: {
            id: this.invoice.id,
            data
          }
        });
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    },
    dltInvoice: async function() {
      try {
        this.loading = true;
        await this.$apollo.mutate({
          mutation: gql`
            mutation delInv($id: ID!) {
              deleteInvoice(input: { where: { id: $id } }) {
                invoice {
                  id
                }
              }
            }
          `,
          variables: {
            id: this.invoice.id
          }
        });
      } catch (error) {
        this.$showError(error);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
table {
  td {
    min-width: 60px;
  }
  th {
    font-weight: 600;
  }
}
.signature-area {
  margin-top: 70px;
  div {
    span {
      display: block;
      margin: auto;
      text-align: center;
      padding-top: 10px;
      border-top: 1px solid #111;
      max-width: 150px;
    }
  }
}
</style>
