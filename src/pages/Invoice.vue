<template>
  <q-page>
    <div class="q-pa-md">
      <inv-header
        v-if="invoice"
        v-model="confirmed_at"
        :editable="editable"
        :invoice="invoice"
      />
      <inv-item-input
        ref="invInput"
        v-if="orderOnly"
        :loading="loading"
        @additem="addToList"
      />

      <!-- items preview -->
      <p v-if="invoiceItems.length" class="print-hide">Item List</p>
      <q-table
        v-if="!readOnly && invoiceItems.length"
        class="print-hide"
        dense
        flat
        hide-bottom
        :rows-per-page-options="[99]"
        :columns="columns"
        :data="invoiceItems"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              size="sm"
              round
              color="info"
              icon="edit"
              flat
              class="on-left"
              @click="editItem({ item: props.row, index: props.rowIndex })"
            />
            <q-btn
              size="sm"
              round
              flat
              color="negative"
              icon="delete"
              @click="removeItem(props.rowIndex)"
            />
          </q-td>
        </template>
        <template v-slot:bottom-row>
          <q-tr style="text-align:right;">
            <q-th colspan="2">{{ $t("total") }}</q-th>
            <q-th>{{ $n(cacheSummary.units) }} </q-th>
            <q-th>
              {{ $t("cash") }} {{ $n(cacheSummary.cash) }}{{ $t("tk") }}
            </q-th>
            <q-th
              >{{ $t("credit") }} {{ $n(cacheSummary.credit) }}{{ $t("tk") }}
            </q-th>
            <q-th>
              = {{ $n(cacheSummary.cash + cacheSummary.credit) }}{{ $t("tk") }}
            </q-th>
          </q-tr>
        </template>
      </q-table>
      <div class="flex-end print-hide row">
        <q-btn
          v-if="invoiceItems.length && orderOnly"
          :disable="loading"
          class="q-mb-lg"
          color="primary"
          @click="submitItems"
        >
          Submit
        </q-btn>
      </div>
      <!-- items view -->
      <p class="print-hide">Submitted Items</p>
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
              size="sm"
              round
              color="info"
              icon="edit"
              flat
              class="on-left"
              @click="editItem({ item: props.row })"
            />
            <q-btn
              :disable="tableActionOn"
              size="sm"
              round
              flat
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
              {{ $t("invoice") }} {{ $t("total") }} =
              {{ $n(summary.cash + summary.credit) }}{{ $t("tk") }}
            </q-th>
          </q-tr>

          <!-- invoice overview -->

          <invoice-overview
            v-if="invoice && invoice.confirmed"
            :dealerId="invoice.dealer.id"
            :date="invoice.confirmed_at"
          />
          <!-- invoice overview end -->
        </template>
      </q-table>

      <div class="row q-mt-lg print-hide flex-end">
        <q-btn
          v-if="
            post === 'area_manager' ||
              (post === 'officer' && invoice && !invoice.confirmed)
          "
          :loading="loading"
          class="on-left"
          flat
          color="negative"
          :label="$t('delete')"
          @click="deleteDialog"
        />
        <q-btn
          v-if="post === 'area_manager' && editable"
          :loading="loading"
          :disable="invoice && !invoice.items.length"
          color="accent"
          :label="$t('confirm')"
          @click="confirmDialog"
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
import updateInvoice from "src/apollo/mutations/updateInvoice.gql";
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
      confirmed_at: "",
      invoiceItems: [],
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
          field: v => this.$n(v.rate)
        },
        {
          label: this.$t("cash"),
          field: v => this.$n(v.type === "cash" ? v.rate * v.units : 0)
        },
        {
          label: this.$t("credit"),
          field: v => this.$n(v.type === "credit" ? v.rate * v.units : 0)
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
    cacheSummary() {
      const sum = this.invoiceItems.reduce(
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
    orderOnly() {
      return this.editable && !this.readOnly;
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
    addToList(item) {
      this.invoiceItems.push(item);
    },
    async submitItems() {
      this.loading = true;
      try {
        const promises = this.invoiceItems.map(item =>
          this.createInvoiceItem(item)
        );
        await Promise.all(promises);
        this.invoiceItems = [];
      } catch (error) {
        console.error(error);
      }
      this.loading = false;
    },
    createInvoiceItem: async function(item) {
      try {
        const { pack, units, type, rate } = item;
        const { data } = await this.$apollo.mutate({
          mutation: CreateInvoiceItem,
          variables: {
            input: {
              data: {
                pack: pack.id,
                units,
                type,
                rate,
                invoice: this.invoice.id
              }
            }
          }
        });
        this.invoice.items.push(data.createInvoiceItem?.invoiceItem);
      } catch (error) {
        this.$showError(error);
      }
    },
    editItem: async function({ item, index }) {
      try {
        if (item.id) {
          await this.delItem(item.id);
        } else if (index >= 0) {
          this.invoiceItems.splice(index, 1);
        }
        this.$refs.invInput.updateItem(item);
      } catch {
        this.$showError(error);
      }
    },

    removeItem(index) {
      this.invoiceItems.splice(index, 1);
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
    confirmDialog() {
      this.$q
        .dialog({
          title: this.$t("confirm"),
          message: this.$t("approve-order?"),
          cancel: true
        })
        .onOk(v => {
          this.confirmInvoice();
        });
    },
    deleteDialog() {
      this.$q
        .dialog({
          title: this.$t("confirm"),
          message: this.$t("delete-order?"),
          cancel: true
        })
        .onOk(() => {
          this.dltInvoice().then(() => {
            this.$router.push("/invoices");
          });
        });
    },
    async confirmInvoice() {
      this.loading = true;
      try {
        const currentDate = new Date();
        const date = new Date(this.confirmed_at);
        date.setMinutes(currentDate.getMinutes());
        date.setHours(currentDate.getHours());
        const payload = {
          confirmed_at: date,
          cash_total: this.summary.cash,
          credit_total: this.summary.credit,
          confirmed: true
        };
        const { data } = await this.$apollo.mutate({
          mutation: updateInvoice,
          variables: {
            id: this.invoice.id,
            data: payload
          }
        });
        this.invoice = data.updateInvoice.invoice;
      } catch (error) {
        this.$showError(error);
      }
      this.loading = false;
    },
    async dltInvoice() {
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
