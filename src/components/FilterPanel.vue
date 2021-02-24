<template>
  <q-card class="q-mb-lg">
    <q-card-section>
      <div class="row">
        <div class="col-6 col-sm-6 q-my-sm col-md-4">
          From:
          <q-btn no-caps outline color="primary"
            >{{ $dt(from, $i18n.locale) }}
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date
                emit-immediately
                navigation-min-year-month="2015/01"
                :first-day-of-week="6"
                mask="YYYY-MM-DD"
                minimal
                v-model="date1"
              >
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn
                    label="cancel"
                    flat
                    v-close-popup
                    @click="cancelFromVal"
                  />
                  <q-btn
                    label="Okay"
                    color="primary"
                    flat
                    v-close-popup
                    @click="inputFromVal"
                  />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-btn>
        </div>
        <div class="col-6 col-sm-6 q-my-sm col-md-4">
          To:
          <q-btn no-caps outline color="primary"
            >{{ $dt(to, $i18n.locale) }}
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-date
                emit-immediately
                navigation-min-year-month="2015/01"
                :first-day-of-week="6"
                mask="YYYY-MM-DD"
                minimal
                v-model="date2"
              >
                <div class="row items-center justify-end q-gutter-sm">
                  <q-btn
                    label="cancel"
                    flat
                    v-close-popup
                    @click="cancelToVal"
                  />
                  <q-btn
                    label="Okay"
                    color="primary"
                    flat
                    v-close-popup
                    @click="inputToVal"
                  />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-btn>
        </div>
        <div class="col-12 q-my-sm col-md-4">
          <q-btn
            color="accent"
            icon="find_in_page"
            :loading="loading"
            @click="$emit('run-query')"
          >
          </q-btn>
          <q-btn
            color="primary"
            class="q-ml-md"
            icon="cached"
            flat
            :disable="loading"
            @click="$emit('refresh')"
          >
          </q-btn>
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <div class="row">
        <div class="col-12 col-sm-4 q-px-sm">
          <q-select
            v-model="field"
            filled
            :loading="loadingItems || $apollo.loading"
            :options="fields"
            placeholder="field"
          >
          </q-select>
        </div>
        <div class="col-12 col-sm-8 q-px-sm">
          <q-select
            v-model="values"
            filled
            multiple
            use-input
            use-chips
            clearable
            options-dense
            :options="options"
            option-label="name"
            option-value="id"
            :placeholder="field + 's'"
            @input-value="setModel"
          >
          </q-select>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import gql from "graphql-tag";
import dealersQuery from "src/apollo/queries/dealers.gql";

const employeesQuery = gql`
  query myEmployees($data: JSON!) {
    employeesConnection(where: $data, limit: 999) {
      groupBy {
        post {
          key
          connection {
            values {
              id
              name
            }
          }
        }
      }
    }
  }
`;

export default {
  props: {
    loading: Boolean
  },
  data() {
    const date1 = new Date();
    const date2 = new Date();
    date1.setDate(1);
    const from = date1.toISOString();
    const to = date2.toISOString();
    return {
      loadingItems: false,
      date1: from,
      date2: to,
      from,
      to,
      field: "dealer",
      value: "",
      values: [],
      fields: [],
      items: {
        dealer: [],
        officer: [],
        regional_sales_manager: [],
        area_manager: []
      }
    };
  },
  computed: {
    variables() {
      const em = this.$store.getters["user/em"];
      if (em.post === "officer") return { officer: em.id };
      else if (em.post === "area_manager") return { officer: { am: em.id } };
      else if (em.post === "regional_sales_manager")
        return { officer: { rsm: em.id } };
      else if (em.post === "director") return { officer: { md: em.id } };
      return {};
    },
    options() {
      const values = this.items[this.field];
      return values.filter(val => {
        const name = val.name.toLowerCase();
        return name.includes(this.value.toLowerCase());
      });
    }
  },
  watch: {
    field() {
      this.values = [];
      this.value = "";
    },
    values: {
      deep: true,
      handler(val) {
        this.$emit("filter-items", {
          field: this.field,
          values: val ? val.map(item => item.id) : []
        });
      }
    }
  },
  apollo: {
    dealers: {
      query: dealersQuery,
      variables() {
        return {
          data: this.variables
        };
      },
      error(err) {
        this.$showError(err);
      },
      update(data) {
        this.items.dealer = data.dealers;
      }
    }
  },
  created() {
    this.loadEmployees();
  },
  methods: {
    async loadEmployees() {
      this.loadingItems = true;
      try {
        const em = this.$store.getters["user/em"];
        let data = {};
        if (em.post === "officer") data.id = em.id;
        else if (em.post === "area_manager") data.am = em.id;
        else if (em.post === "regional_sales_manager") data.am = rsm.id;
        else if (em.post === "director") data.md = rsm.id;

        const resp = await this.$apollo.query({
          query: employeesQuery,
          variables: { data }
        });
        const fields = ["dealer"];
        resp.data.employeesConnection.groupBy.post.forEach(item => {
          fields.push(item.key);
          this.items[item.key] = item.connection.values;
        });
        this.fields = fields;
      } catch (error) {
        this.$showError(error);
      }
      this.loadingItems = false;
    },
    setModel(val) {
      this.value = val;
    },
    dateRange() {
      const from = new Date(this.from);
      const to = new Date(this.to);
      to.setHours(23, 59, 59);
      return { from, to };
    },
    inputFromVal() {
      this.from = this.date1;
    },
    cancelFromVal() {
      this.date1 = this.from;
    },
    inputToVal() {
      this.to = this.date2;
    },
    cancelToVal() {
      this.date2 = this.to;
    }
  }
};
</script>
