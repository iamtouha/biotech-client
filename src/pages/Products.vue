<template>
  <q-page>
    <div class="q-pa-md">
      <div class="q-mb-lg">
        <q-input v-model="search" label="Search Products" debounce="100">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <q-linear-progress v-show="$apollo.loading" indeterminate />
      <div class="product-grid">
        <router-link
          v-for="product in filteredProducts"
          :key="product.id"
          tag="div"
          class="cursor-pointer"
          :to="'/products/' + product.id"
        >
          <q-markup-table class="full-height">
            <thead>
              <tr>
                <th colspan="5" class="q-my-md text-h5">
                  <div class="q-my-xs text-h6">
                    {{ product.name }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th class="text-left">{{ $t("pack") }}</th>
                <th>{{ $t("cash-rate") }}</th>
                <th>{{ $t("credit-rate") }}</th>
              </tr>
              <tr
                class="text-center"
                v-for="{ size, cash_rate, credit_rate } in product.packs"
                :key="size"
              >
                <td class="text-left">{{ size }}</td>
                <td>{{ cash_rate ? `${$n(cash_rate)} ${$t("tk")}` : "-" }}</td>
                <td>
                  {{ credit_rate ? `${$n(credit_rate)} ${$t("tk")}` : "-" }}
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </router-link>
      </div>
    </div>
    <q-dialog
      v-model="newProd"
      persistent
      transition-show="scale"
      transition-hide="scale"
    >
      <q-card style="width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $t("new") }} {{ $t("product") }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            filled
            v-model="productName"
            type="text"
            :label="$t('name')"
          ></q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" @click="newProd = false"></q-btn>
          <q-btn
            flat
            label="Create"
            color="primary"
            @click="createProduct"
            :loading="loading"
            :disable="!productName.length"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-page-sticky v-if="isDirector" position="bottom-right" :offset="[24, 24]">
      <q-btn @click="newProd = true" fab icon="add" color="accent" />
    </q-page-sticky>
  </q-page>
</template>

<script>
import cloneDeep from "lodash.clonedeep";
import gql from "graphql-tag";
import Products from "src/apollo/queries/products.gql";
export default {
  name: "Products",
  data() {
    return {
      newProd: false,
      products: [],
      search: "",
      productName: "",
      loading: false
    };
  },
  computed: {
    filteredProducts() {
      const products = cloneDeep(this.products);
      const sorted = products
        .sort((a, b) => b.packs.length - a.packs.length)
        .filter(val =>
          val.name.toLowerCase().includes(this.search.toLowerCase())
        );
      return sorted;
    },
    isDirector() {
      const em = this.$store.getters["user/em"];
      return em.post === "director";
    }
  },
  apollo: {
    products: {
      query: Products,
      error(error) {
        console.log(error);
        this.$q.notify({ type: "negative", message: error.message });
      }
    }
  },
  methods: {
    async createProduct() {
      const em = this.$store.getters["user/em"];
      if (em.post !== "director") return;
      this.loading = true;
      const mutation = gql`
        mutation($input: ProductInput) {
          createProduct(input: { data: $input }) {
            product {
              id
            }
          }
        }
      `;
      try {
        const { data } = await this.$apollo.mutate({
          mutation,
          variables: {
            input: {
              director: em.id,
              name: this.productName
            }
          }
        });
        this.$router.push("/products/" + data.createProduct.product.id);
      } catch (error) {
        console.log(error);
        this.$q.notify({ type: "negative", message: error.message });
      }
      this.loading = false;
      this.newProd = false;
    }
  }
};
</script>

<style lang="scss">
.product-grid {
  width: 100%;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
</style>
