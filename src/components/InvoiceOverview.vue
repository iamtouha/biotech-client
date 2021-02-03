<template>
  <q-tr class="text-right" style="font-weight:600;">
    <q-td colspan="2">
      {{ $t("dealer-summary") }}
      <q-circular-progress
        v-if="$apollo.loading"
        indeterminate
      ></q-circular-progress>
    </q-td>
    <q-td colspan="2">
      {{ $t("total-cash") }} = {{ $n(overview.cash_total) + $t("tk") }}
    </q-td>
    <q-td>
      {{ $t("total-credit") }} = {{ $n(overview.credit_total) + $t("tk") }}
    </q-td>
    <q-td>
      {{ this.$t("subtotal") }} =
      {{ $n(overview.cash_total + overview.credit_total) + $t("tk") }}
    </q-td>
  </q-tr>
</template>

<script>
import gql from "graphql-tag";
const query = gql`
  query dealerSum($dealerId: ID!, $date: DateTime!) {
    invoicesConnection(
      where: { confirmed: true, dealer: $dealerId, confirmed_at_lte: $date }
    ) {
      aggregate {
        sum {
          cash_total
          credit_total
        }
      }
    }
    transactionsConnection(
      where: { confirmed: true, dealer: $dealerId, date_lte: $date }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;
export default {
  name: "InvoiceOverview",
  props: {
    dealerId: String,
    date: String
  },
  data() {
    return {
      overview: {
        cash_total: 0,
        credit_total: 0
      }
    };
  },
  apollo: {
    overview: {
      query,
      variables() {
        return {
          dealerId: this.dealerId,
          date: this.date
        };
      },
      update({
        invoicesConnection: {
          aggregate: {
            sum: { cash_total, credit_total }
          }
        },
        transactionsConnection: {
          aggregate: {
            sum: { amount }
          }
        }
      }) {
        const cash_due = cash_total - amount;
        if (cash_due < 0) {
          return {
            cash_total: 0,
            credit_total: credit_total + cash_due
          };
        } else {
          return { cash_total: cash_due, credit_total };
        }
      }
    }
  }
};
</script>

<style scoped>
table {
  min-width: 340px;
}
</style>
