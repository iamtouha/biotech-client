<template>
  <q-page class="container">
    <q-dialog v-model="dialog" persistent>
      <q-card style="width:350px">
        <q-card-section class="text-h6 q-pb-none text-center">
          {{ $t("pack") }}
        </q-card-section>
        <q-card-section>
          <div class="row">
            <div class="col-12 q-px-sm">
              <q-input
                v-model="pack.size"
                :label="$t('size')"
                type="text"
              ></q-input>
            </div>
          </div>
          <div class="row">
            <div class="col-6 q-px-sm">
              <q-input
                v-model="pack.cash_rate"
                :label="$t('cash-rate')"
                type="number"
              ></q-input>
            </div>
            <div class="col-6 q-px-sm">
              <q-input
                v-model="pack.credit_rate"
                :label="$t('credit-rate')"
                type="number"
              ></q-input>
            </div>
          </div>
        </q-card-section>
        <q-card-actions v-if="isDirector" align="right">
          <q-btn
            :disable="loading"
            flat
            color="grey"
            label="cancel"
            @click="dialog = false"
          />
          <q-btn
            :loading="loading"
            :disable="!Boolean(pack.size.length)"
            flat
            color="accent"
            :label="pack.id ? 'update' : 'Create'"
            @click="createPack"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="q-pa-lg">
      <div class="row">
        <div class="col-12 col-md-6">
          <q-input
            v-model="product.name"
            :disable="!isDirector"
            :loading="$apollo.loading || loading"
            color="info"
            :label="$t('product-name')"
          >
          </q-input>
        </div>
        <div v-if="isDirector" class="col-6 q-my-sm">
          <q-btn
            color="primary"
            flat
            label="update"
            class="q-mr-sm"
            :disable="!Boolean(product.name.length) || loading"
            @click="renameProduct"
          >
          </q-btn>
          <q-btn
            color="negative"
            flat
            label="delete"
            title="delete all packs first"
            :disable="Boolean(product.packs.length) || loading"
            @click="deleteProduct"
          >
          </q-btn>
        </div>
      </div>
      <div class="row">
        <div class="col-12 q-mt-sm">
          <q-markup-table flat bordered>
            <tbody>
              <tr>
                <th class="text-left">{{ $t("pack") }}</th>
                <th>{{ $t("cash-rate") }}</th>
                <th>{{ $t("credit-rate") }}</th>
                <th v-if="isDirector">{{ $t("actions") }}</th>
              </tr>
              <tr
                class="text-center"
                v-for="item in product.packs"
                :key="item.id"
              >
                <td class="text-left">{{ item.size }}</td>
                <td>
                  {{
                    item.cash_rate ? `${$n(item.cash_rate)} ${$t("tk")}` : "-"
                  }}
                </td>
                <td>
                  {{
                    item.credit_rate
                      ? `${$n(item.credit_rate)} ${$t("tk")}`
                      : "-"
                  }}
                </td>
                <td v-if="isDirector">
                  <q-btn
                    size="sm"
                    round
                    color="negative"
                    icon="delete"
                    :disable="loading"
                    @click="removePack(item.id)"
                  ></q-btn>
                  <q-btn
                    class="q-ml-sm"
                    size="sm"
                    round
                    color="info"
                    icon="edit"
                    :disable="loading"
                    @click="updatePack(item)"
                  />
                </td>
              </tr>
            </tbody>
            <tfoot v-if="isDirector">
              <td class="text-center" colspan="4">
                <q-btn
                  color="accent"
                  @click="dialog = true"
                  :label="$t('new') + ' ' + $t('pack')"
                ></q-btn>
              </td>
            </tfoot>
          </q-markup-table>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
import cloneDeep from "lodash.clonedeep";
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
const deletePack = gql`
  mutation deletePack($id: ID!) {
    deletePack(input: { where: { id: $id } }) {
      pack {
        id
      }
    }
  }
`;
const createPack = gql`
  mutation createPack($data: PackInput!) {
    createPack(input: { data: $data }) {
      pack {
        id
        size
        cash_rate
        credit_rate
      }
    }
  }
`;
const updatePack = gql`
  mutation updatePack($id: ID!, $data: editPackInput!) {
    updatePack(input: { where: { id: $id }, data: $data }) {
      pack {
        id
        size
        cash_rate
        credit_rate
      }
    }
  }
`;
const renameProduct = gql`
  mutation renameProduct($id: ID!, $data: editProductInput) {
    updateProduct(input: { where: { id: $id }, data: $data }) {
      product {
        id
      }
    }
  }
`;
const deleteProduct = gql`
  mutation deleteProduct($id: ID!) {
    deleteProduct(input: { where: { id: $id } }) {
      product {
        id
      }
    }
  }
`;
export default {
  name: "Product",
  data() {
    return {
      dialog: false,
      loading: false,
      pack: {
        size: "",
        cash_rate: 0,
        credit_rate: 0
      },
      product: {
        name: "",
        packs: []
      }
    };
  },
  apollo: {
    product: {
      query: productQuery,
      fetchPolicy: "network-first",
      variables() {
        return {
          id: this.$route.params.id
        };
      },
      error(err) {
        console.log("err");
      }
    }
  },
  computed: {
    isDirector() {
      const em = this.$store.getters["user/em"];
      return em.post === "director";
    }
  },
  methods: {
    async renameProduct() {
      this.loading = true;
      try {
        await this.$apollo.mutate({
          mutation: renameProduct,
          variables: {
            id: this.product.id,
            data: { name: this.product.name }
          }
        });
      } catch (error) {
        this.$q.notify({ type: "negative", message: error.message });
      }
      this.loading = false;
    },
    async deleteProduct() {
      this.loading = true;
      try {
        await this.$apollo.mutate({
          mutation: deleteProduct,
          variables: {
            id: this.product.id
          }
        });
        this.$router.push("/products");
      } catch (error) {
        this.$q.notify({ type: "negative", message: error.message });
      }
      this.loading = false;
    },
    async createPack() {
      this.loading = true;
      try {
        const { size, cash_rate, credit_rate, id } = this.pack;
        if (id) {
          const { data } = await this.$apollo.mutate({
            mutation: updatePack,
            variables: {
              id,
              data: {
                size,
                cash_rate: +cash_rate,
                credit_rate: +credit_rate
              }
            }
          });
          const index = this.product.packs.findIndex(item => item.id === id);
          this.product.packs.splice(index, 1, data.updatePack.pack);
        } else {
          const { data } = await this.$apollo.mutate({
            mutation: createPack,
            variables: {
              data: {
                product: this.product.id,
                size,
                cash_rate: +cash_rate,
                credit_rate: +credit_rate
              }
            }
          });
          this.product.packs.push(data.createPack.pack);
        }
        this.dialog = false;
        this.pack = { size: "", cash_rate: 0, credit_rate: 0, id: null };
      } catch (error) {
        this.$q.notify({ type: "negative", message: error.message });
      }
      this.loading = false;
    },
    async removePack(id) {
      this.loading = true;
      try {
        await this.$apollo.mutate({
          mutation: deletePack,
          variables: {
            id
          }
        });
        this.product.packs = this.product.packs.filter(pack => pack.id !== id);
      } catch (error) {
        this.$q.notify({ type: "negative", message: error.message });
      }
      this.loading = false;
    },
    updatePack(item) {
      this.pack = cloneDeep(item);
      this.dialog = true;
    }
  }
};
</script>

<style></style>
