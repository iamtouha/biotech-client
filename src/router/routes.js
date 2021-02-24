import MainLayout from "layouts/MainLayout.vue";
import AuthLayout from "layouts/Auth.vue";
import HomePage from "pages/Home.vue";
import Products from "pages/Products.vue";
import Product from "pages/Product.vue";
import Invoices from "pages/Invoices.vue";
import Orders from "pages/Orders.vue";
import Transactions from "pages/Transactions.vue";
import Dealers from "pages/Dealers.vue";
import Invoice from "pages/Invoice.vue";
import LogIn from "pages/Login.vue";
import Account from "pages/Account.vue";
import Error404 from "pages/Error404.vue";

const routes = [
  {
    path: "/",
    component: MainLayout,

    children: [
      {
        path: "",
        name: "Home",
        component: HomePage,
        meta: {
          auth: true
        }
      },
      {
        path: "products",
        name: "Products",
        component: Products,
        meta: {
          auth: true
        }
      },
      {
        path: "products/:id",
        name: "Product",
        component: Product,
        meta: {
          auth: true
        }
      },
      {
        path: "invoices",
        name: "Invoices",
        component: Invoices,
        meta: {
          auth: true
        }
      },
      {
        path: "orders",
        name: "Orders",
        component: Orders,
        meta: {
          auth: true
        }
      },
      {
        path: "invoices/:id",
        name: "Invoice",
        component: Invoice,
        meta: {
          auth: true
        }
      },
      {
        path: "txns",
        name: "Transactions",
        component: Transactions,
        meta: {
          auth: true
        }
      },
      {
        path: "dealers",
        name: "dealers",
        component: Dealers,
        meta: {
          auth: true
        }
      },
      {
        path: "/account",
        name: "account",
        component: Account,
        meta: {
          auth: true
        }
      }
    ]
  },
  {
    path: "/auth",
    component: AuthLayout,
    children: [
      {
        path: "login",
        name: "login",
        component: LogIn,
        meta: {
          auth: false
        }
      }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: "*",
    component: Error404
  }
];

export default routes;
