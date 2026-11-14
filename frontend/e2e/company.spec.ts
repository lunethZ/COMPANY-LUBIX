import { test, expect, type Page } from "@playwright/test";

/**
 * Flujo E2E de empresa (P-04):
 * panel de la empresa con productos, pedidos, estadísticas y reseñas.
 * El backend se simula con `page.route`.
 */

const COMPANY_USER = {
  id: "company-1",
  name: "TechStore",
  email: "tienda@lubix.test",
  role_id: "empresa",
};

const companyProfile = {
  nameCompany: "TechStore",
  emailCompany: "tienda@lubix.test",
  tellCompany: "3001234567",
  completeSales: 12,
  averageRating: 4.5,
  totalRevenue: 5_000_000,
  totalReviews: 3,
  logo: null,
  banner: null,
};

const product = {
  id: "p1",
  name: "Portátil Lubix Pro",
  price: 2_000_000,
  images: [],
  sold: 8,
  views: 120,
  stock: 5,
  status: "active",
  catalog_name: "Computadores",
};

const order = {
  id: "order-1",
  status: "pending",
  subtotal: 2_000_000,
  discount: 0,
  shipping: 0,
  total: 2_000_000,
  payment_method: "tarjeta",
  recipient: "Ana Tester",
  address: "Calle 10 #20-30",
  city: "Bogotá",
  department: "Cundinamarca",
  postal_code: "110111",
  created_at: "2026-11-01T10:00:00",
  estimated_delivery: "2026-11-05T10:00:00",
  delivery_progress: 40,
  buyer_email: "ana.tester@lubix.test",
  buyer_name: "Ana Tester",
  items: [
    {
      id: "oi1",
      product_id: "p1",
      name: "Portátil Lubix Pro",
      price: 2_000_000,
      quantity: 1,
    },
  ],
};

const review = {
  id: "r1",
  user_name: "Ana Tester",
  comment: "Excelente producto y envío rápido",
  rating: 5,
  created_at: "2026-11-02T10:00:00",
};

async function seedSession(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem("access_token", "e2e-company-token");
    localStorage.setItem("refresh_token", "e2e-company-refresh");
    localStorage.setItem("user", JSON.stringify(user));
  }, COMPANY_USER);
}

async function mockCompanyApi(page: Page) {
  await page.route("**/cart/merge", (route) =>
    route.fulfill({ json: { items: [], subtotal: 0, total_items: 0 } }),
  );
  await page.route("**/cart", (route) =>
    route.fulfill({ json: { items: [], subtotal: 0, total_items: 0 } }),
  );
  await page.route("**/company/dashboard/me", (route) =>
    route.fulfill({
      json: {
        nameCompany: companyProfile.nameCompany,
        emailCompany: companyProfile.emailCompany,
        tellCompany: companyProfile.tellCompany,
        sales: companyProfile.completeSales,
        stars: companyProfile.averageRating,
        totalRevenue: companyProfile.totalRevenue,
        reviews: companyProfile.totalReviews,
        memberAT: "2026-01-01T10:00:00",
      },
    }),
  );
  await page.route("**/company/dashboard/my-profile", (route) =>
    route.fulfill({ json: companyProfile }),
  );
  await page.route("**/company/products", (route) =>
    route.fulfill({ json: [product] }),
  );
  await page.route("**/company/orders", (route) =>
    route.fulfill({ json: [order] }),
  );
  await page.route("**/products/p1/reviews", (route) =>
    route.fulfill({ json: [review] }),
  );
}

test("panel de empresa: carga productos, pedidos y estadísticas", async ({
  page,
}) => {
  await seedSession(page);
  await mockCompanyApi(page);

  await page.goto("/dashboard-empresa");

  // Datos cargados desde la API simulada.
  await expect(
    page.getByRole("heading", { name: "TechStore", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Mis Productos/ }),
  ).toBeVisible();
  await expect(page.getByText("Portátil Lubix Pro")).toBeVisible();

  // Pestaña de pedidos.
  await page.getByRole("button", { name: "Pedidos" }).click();
  await expect(
    page.getByRole("heading", { name: /Pedidos recibidos \(1\)/ }),
  ).toBeVisible();
  await expect(page.getByText(/Ana Tester/)).toBeVisible();

  // Pestaña de estadísticas.
  await page.getByRole("button", { name: "Estadísticas" }).click();
  await expect(page.getByText("Ventas totales")).toBeVisible();
  await expect(page.getByText("Productos activos")).toBeVisible();
});

test("panel de empresa: muestra las reseñas de sus productos", async ({
  page,
}) => {
  await seedSession(page);
  await mockCompanyApi(page);

  await page.goto("/dashboard-empresa");
  await expect(
    page.getByRole("heading", { name: "TechStore", level: 1 }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Reseñas" }).click();

  await expect(
    page.getByRole("heading", { name: "Reseñas de productos" }),
  ).toBeVisible();
  await expect(page.getByText("Ana Tester")).toBeVisible();
  await expect(
    page.getByText("Excelente producto y envío rápido"),
  ).toBeVisible();
});
