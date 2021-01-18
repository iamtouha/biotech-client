<template>
  <q-page>
    <div class="q-pa-md">
      <q-form
        ref="dealerForm"
        @submit="updateDealer"
        @reset="dealer = { id: null, name: '', address: '', phone: '' }"
      >
        <div class="row q-pa-sm shadow-2 print-hide">
          <div class="col-12 col-sm-6 q-pa-sm">
            <q-input
              :rules="[v => v.length > 5 || $t('minimum-5-letter')]"
              v-model="dealer.name"
              :label="$t('dealer-name')"
            ></q-input>
          </div>
          <div class="col-12 col-sm-6 q-pa-sm">
            <q-input
              v-model="dealer.address"
              :rules="[v => v.length > 5 || $t('minimum-5-letter')]"
              :label="$t('dealer-address')"
            ></q-input>
          </div>
          <div class="col-12 col-sm-6 q-pa-sm">
            <q-input
              :maxlength="14"
              :rules="[v => v.length > 5 || $t('minimum-11-letter')]"
              v-model="dealer.phone"
              :label="$t('phone')"
            ></q-input>
          </div>
          <div class="col-12 q-pa-sm">
            <q-btn
              :loading="loading"
              type="submit"
              :label="dealer.id ? $t('update') : $t('add-to-list')"
              class="bg-accent float-right"
              @click="updateDealer"
            />
            <q-btn
              v-if="dealer.id"
              flat
              type="reset"
              class="float-right"
              :label="$t('cancel')"
            />
          </div>
        </div>
      </q-form>
      <q-table
        class="q-mt-md"
        flat
        dense
        :loading="$apollo.loading"
        :columns="columns"
        :data="dealers"
      >
        <template v-slot:body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              size="sm"
              round
              color="info"
              icon="edit"
              class="q-mr-sm"
              @click="editItem(props.row)"
            />
            <q-btn
              v-if="
                !props.row.invoices.length || !props.row.transactions.length
              "
              size="sm"
              round
              color="negative"
              icon="delete"
              @click="delItem(props.row.id)"
            />
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script>
import gql from "graphql-tag";
const dealersQuery = gql`
  query($data: JSON!) {
    dealers(where: $data) {
      name
      id
      index
      address
      phone
      officer {
        id
        name
      }
      invoices {
        id
      }
      transactions {
        id
      }
    }
  }
`;
const updateDealerQuery = gql`
  mutation updateDealer($id: ID!, $data: editDealerInput!) {
    updateDealer(input: { where: { id: $id }, data: $data }) {
      dealer {
        id
        name
        officer {
          id
          name
        }
        transactions {
          id
        }
        address
        phone
        invoices {
          id
        }
      }
    }
  }
`;
const createDealerQuery = gql`
  mutation($data: DealerInput!) {
    createDealer(input: { data: $data }) {
      dealer {
        id
        address
        phone
        name
        officer {
          id
          name
        }
        invoices {
          id
        }
        transactions {
          id
        }
      }
    }
  }
`;
const deleteDealer = gql`
  mutation($id: ID!) {
    deleteDealer(input: { where: { id: $id } }) {
      dealer {
        id
      }
    }
  }
`;
export default {
  name: "Dealers",
  data() {
    return {
      loading: false,
      dealer: {
        id: null,
        name: "",
        address: "",
        phone: ""
      },
      dealers: [],
      columns: [
        { label: "#", field: "index" },
        { label: this.$t("name"), field: "name", align: "left" },
        { label: this.$t("address"), field: "address" },
        { label: this.$t("phone"), field: "phone" },
        { label: this.$t("officer"), field: v => v.officer.name },
        { label: this.$t("actions"), name: "actions", align: "center" }
      ]
    };
  },
  computed: {
    variables() {
      const em = this.$store.getters["user/em"];
      if (em.post === "officer") return { officer: em.id };
      else if (em.post === "area_manager") return { officer: { am: em.id } };
      else if (em.post === "regional_sales_manager")
        return { officer: { rsm: em.id } };
      else if (em.post === "managing_director")
        return { officer: { md: em.id } };
      return {};
    }
  },
  apollo: {
    dealers: {
      query: dealersQuery,
      fetchPolicy: "network-only",
      variables() {
        return {
          data: this.variables
        };
      },
      error(err) {
        this.$showError(err);
      }
    }
  },
  methods: {
    editItem(dealer) {
      const { id, name, phone, address } = dealer;

      this.dealer = { id, name, phone, address };
    },
    delItem(id) {
      this.$q
        .dialog({
          title: this.$t("confirm"),
          message: this.$t("delete-dealer?"),
          cancel: true
        })
        .onOk(() => {
          this.$apollo
            .mutate({
              mutation: deleteDealer,
              variables: { id }
            })
            .then(data => {
              const index = this.dealers.findIndex(dl => dl.id === id);
              this.dealers.splice(index, 1);
            })
            .catch(this.$showError);
        });
    },
    updateDealer: async function() {
      this.loading = true;
      try {
        const { id, name, address, phone } = this.dealer;
        if (id) {
          const { data } = await this.$apollo.mutate({
            mutation: updateDealerQuery,
            variables: {
              id,
              data: { name, address, phone }
            }
          });
          const index = this.dealers.findIndex(dlr => dlr.id === id);
          this.dealers.splice(index, 1, data.updateDealer.dealer);
        } else if (name && address && phone) {
          const { data } = await this.$apollo.mutate({
            mutation: createDealerQuery,
            variables: {
              data: { name, address, phone, officer: 1 }
            }
          });
          this.dealers.push(data.createDealer.dealer);
        }
        this.$refs.dealerForm.reset();
        this.loading = false;
      } catch (error) {
        this.$showError(error);
      }
    }
  }
};
</script>
