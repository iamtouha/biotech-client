<template>
  <q-form id="itemForm" @submit.prevent="submitItem">
    <div class="row print-hide shadow-2 q-my-md">
      <div class="col-12 col-sm-6 q-pa-sm">
        <q-select
          use-input
          filled
          v-model="product"
          :loading="$apollo.loading"
          :label="$t('select-product')"
          @filter="filterFn"
          :input-debounce="100"
          option-label="name"
          option-value="id"
          :options="productOptions"
        ></q-select>
      </div>
      <div class="col-12 col-sm-6 q-pa-sm">
        <q-select
          v-model="pack"
          filled
          :label="$t('select-pack')"
          option-label="size"
          option-value="id"
          :options="packs"
        ></q-select>
      </div>
      <div class="col-12 col-sm-4 q-pa-sm">
        <q-btn-toggle
          class="no-shadow bg-grey-3"
          v-model="item.type"
          :options="[
            { label: $t('cash'), value: 'cash' },
            { label: $t('credit'), value: 'credit' }
          ]"
        >
        </q-btn-toggle>
      </div>
      <div class="col-6 col-sm-4 q-pa-sm">
        <q-input
          filled
          v-model="item.rate"
          type="number"
          :label="$t('rate')"
        ></q-input>
      </div>
      <div class="col-6 col-sm-4 q-pa-sm">
        <q-input
          filled
          v-model="item.units"
          type="number"
          :label="$t('units')"
        ></q-input>
      </div>
      <div class="col-12 q-pa-sm">
        <p class="float-left">
          {{ $t("total") }}({{ $t("tk") }}): {{ $n(item.rate * item.units) }}
        </p>
        <q-btn
          type="submit"
          :label="$t('add-to-list')"
          :disable="!valid"
          flat
          :loading="loading"
          color="accent"
          class="float-right bg-grey-3"
        />
      </div>
    </div>
  </q-form>
</template>

<script>
import Products from "src/apollo/queries/products.gql";

export default {
  name: "invoiceItemInput",
  props: {
    loading: Boolean
  },

  data: () => ({
    products: [],
    freeze: false,
    product: null,
    pack: null,
    item: {
      rate: 0,
      units: 0,
      type: "cash"
    },
    search: ""
  }),
  computed: {
    packs() {
      const product = this.products.find(pd => pd.id === this.product?.id);
      return product ? product.packs : [];
    },
    productOptions() {
      return this.products.filter(pd =>
        pd.name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    valid() {
      const { pack, rate, units, type } = this.item;
      return !!(pack && rate > 0 && units > 0 && type);
    }
  },
  watch: {
    pack: {
      deep: true,
      handler(val) {
        if (this.freeze) return;
        else if (val) {
          this.item.pack = val.id;
          this.item.rate =
            this.item.type === "cash"
              ? val.cash_rate || 0
              : val.credit_rate || 0;
          this.item.units = 0;
        } else {
          this.item.units = 0;
          this.item.rate = 0;
          this.item.pack = null;
        }
      }
    },
    "item.type"(val) {
      if (this.freeze) return;
      if (val === "cash" && this.pack) {
        this.item.rate = this.pack.cash_rate || 0;
      } else if (val === "credit" && this.pack) {
        this.item.rate = this.pack.credit_rate || 0;
      }
    },
    product: {
      deep: true,
      handler() {
        if (this.freeze) return;
        this.pack = null;
      }
    }
  },
  apollo: {
    products: {
      query: Products,
      error(error) {
        this.$showError(error);
      }
    }
  },
  methods: {
    filterFn(val, update) {
      update(() => {
        this.search = val.toLowerCase();
      });
    },
    submitItem() {
      const { rate, units, type } = this.item;
      if (this.valid) {
        this.$emit("additem", {
          pack: {
            ...this.pack,
            product: this.product
          },
          rate: +rate,
          units: +units,
          type
        });
        this.pack = null;
      } else {
        this.$q.notify({
          type: "negative",
          message: "Invalid input"
        });
      }
    },
    updateItem(item) {
      this.freeze = true;
      const {
        pack: {
          id,
          product: { id: productId }
        },
        type,
        rate,
        units
      } = item;
      this.product = this.products.find(pd => pd.id === productId);
      this.pack = this.product.packs.find(sz => sz.id === id);
      this.item.rate = rate;
      this.item.type = type;
      this.item.units = units;
      this.item.product = id;
      setTimeout(() => {
        this.freeze = false;
      }, 10);
    }
  }
};
</script>
