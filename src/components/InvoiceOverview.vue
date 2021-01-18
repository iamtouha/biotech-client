<template>
  <table class="text-left">
    <caption class="q-mb-sm text-weight-bold text-left">
      {{
        $t("dealer-summary")
      }}
    </caption>
    <tr>
      <td>{{ $t("total-cash") }}</td>
      <td class="text-right">{{ $n(overview.cash_total) + $t("tk") }}</td>
    </tr>
    <tr>
      <td>{{ $t("total-credit") }}</td>
      <td class="text-right">{{ $n(overview.credit_total) + $t("tk") }}</td>
    </tr>
    <tr>
      <td colspan="2">
        <hr class="q-my-0" />
      </td>
    </tr>
    <tr>
      <th>{{ $t("subtotal") }}</th>
      <th class="text-right">
        {{ $n(overview.cash_total + overview.credit_total) + $t("tk") }}
      </th>
    </tr>
  </table>
</template>

<script>
import gql from "graphql-tag";
const query = gql`
  query dealerSum($dealerId: ID!) {
    invoicesConnection(where: { confirmed: true, dealer: $dealerId }) {
      aggregate {
        sum {
          cash_total
          credit_total
        }
      }
    }
    transactionsConnection(where: { confirmed: true, dealer: $dealerId }) {
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
    dealerId: String
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
          dealerId: this.dealerId
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
  min-width: 250px;
}
</style>
