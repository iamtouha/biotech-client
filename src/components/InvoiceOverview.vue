<template>
  <tr>
    <td v-if="$apollo.loading">
      <q-circular-progress indeterminate></q-circular-progress>
    </td>
    <td v-if="!$apollo.loading">
      {{ $t("total-cash") }} {{ $n(overview.cash_total) + $t("tk") }}
    </td>
    <td v-if="!$apollo.loading">
      {{ $t("total-credit") }} {{ $n(overview.credit_total) + $t("tk") }}
    </td>
    <th v-if="!$apollo.loading">
      = {{ $n(overview.cash_total + overview.credit_total) + $t("tk") }}
    </th>
  </tr>
</template>

<script>
import gql from "graphql-tag";
const query = gql`
  query dealerSum($dealerId: ID!, $date: Date!) {
    invoicesConnection(
      where: { confirmed: true, dealer: $dealerId, confirm_date_lte: $date }
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
      overview: {}
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
