<template>
  <div class="row">
    <div class="col-6">
      <table class="q-mb-md" style="text-align:left;">
        <tr>
          <th colspan="2">
            {{ invoice.confirmed ? "Invoice" : "Order" }} #{{ invoice.index }}
          </th>
        </tr>
        <tr>
          <td style="vertical-align:top;">{{ $t("dealer") }}</td>
          <td>
            <b>:&nbsp;{{ invoice.dealer.name }}</b>
            <br />
            &nbsp;{{ invoice.dealer.address }}
            <br />
            &nbsp;{{ invoice.dealer.phone }}
          </td>
        </tr>
        <tr class="print-hide">
          <td>{{ $t("officer") }}</td>
          <th>:&nbsp;{{ invoice.officer.name }}</th>
        </tr>
        <tr class="print-hide">
          <td>{{ $t("order-date") }}</td>
          <td>:&nbsp;{{ $dt(invoice.createdAt, $i18n.locale) }}</td>
        </tr>
        <tr class="print-hide" v-if="editable || invoice.confirmed_at">
          <td>{{ $t("date") }}</td>
          <td v-if="editable">
            <q-btn outline color="primary"
              >{{ $dt(value, $i18n.locale) }}
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
                      label="cancel"
                      flat
                      v-close-popup
                      @click="cancelVal"
                    />
                    <q-btn
                      label="Okay"
                      color="primary"
                      flat
                      v-close-popup
                      @click="inputVal"
                    />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-btn>
          </td>
          <td v-else-if="invoice.confirmed_at">
            :&nbsp;{{ $dt(invoice.confirmed_at, $i18n.locale) }}
          </td>
        </tr>
      </table>
    </div>
    <div class="col-6 print-only">
      <table class="q-mb-md q-ml-auto q-mr-0" style="text-align:left;">
        <tr>
          <td>{{ $t("officer") }}</td>
          <th>:&nbsp;{{ invoice.officer.name }}</th>
        </tr>
        <tr :class="[invoice.confirmed ? ' print-hide' : '']">
          <td>{{ $t("order-date") }}</td>
          <td>:&nbsp;{{ $dt(invoice.createdAt, $i18n.locale) }}</td>
        </tr>
        <tr v-if="invoice.confirmed_at">
          <td>{{ $t("date") }}</td>
          <td>:&nbsp;{{ $dt(invoice.confirmed_at, $i18n.locale) }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: "InvoiceHeader",
  props: {
    invoice: Object,
    editable: Boolean,
    value: String
  },

  data: () => ({
    date: new Date()
  }),
  computed: {
    vl() {
      return this.$d(new Date(), "short", "bn");
    }
  },

  created() {
    if (this.editable) {
      this.inputVal();
    }
  },
  methods: {
    inputVal() {
      this.$emit("input", this.$moment(this.date).format("YYYY-MM-DD"));
    },
    cancelVal() {
      this.date = this.value;
    }
  }
};
</script>

<style></style>
