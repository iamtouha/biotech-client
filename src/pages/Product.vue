<template>
  <q-page>
    <div class="q-pa-lg">
      <div class="row">
        <div class="col-12 col-sm-6">
          <q-input
            v-model="product.name"
            color="info"
            :label="$t('product-name')"
          >
          </q-input>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
const productQuery = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      packs {
        size
        id
        cash_rate
        credit_rate
      }
    }
  }
`;
export default {
  name: "Product",
  data() {
    return {
      product: {}
    };
  },
  apollo: {
    product: {
      query: productQuery,
      variables() {
        return {
          id: this.$route.params.id
        };
      }
    }
  }
};
</script>

<style></style>
