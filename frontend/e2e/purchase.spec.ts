import { test, expect, type Page } from "@playwright/test";

/**
 * Flujo E2E de compra (P-04):
 * sesión de usuario -> carrito -> datos de envío -> pago con tarjeta -> confirmación.
 * Todo el backend se simula con `page.route`, así que la prueba no depende de la API real.
 */

const USER = {
  id: "user-1",
  name: "Ana Tester",
  email: "ana.tester@lubix.test",
  role_id: "user",
};

const cartItem = {
  id: "p1",
  product_id: "p1",
  name: "Portátil Lubix Pro",
  price: 2_000_000,
  discount_enable: false,
  discount_value: 0,
  unit_price: 2_000_000,
  image: "",
  stock: 5,
  quantity: 1,
  line_total: 2_000_000,
};

async function seedSession(page: Page) {
  await page.addInitScript((user) => {
    localStorage.setItem("access_token", "e2e-access-token");
    localStorage.setItem("refresh_token", "e2e-refresh-token");
    localStorage.setItem("user", JSON.stringify(user));
  }, USER);
}

async function mockPurchaseApi(page: Page) {
  await page.route("**/cart/merge", (route) =>
    route.fulfill({ json: { items: [], subtotal: 0, total_items: 0 } }),
  );
  await page.route("**/cart", (route) => {
    if (route.request().method() === "DELETE") {
      return route.fulfill({ json: { message: "Carrito vaciado" } });
    }
    return route.fulfill({
      json: {
        items: [cartItem],
        subtotal: cartItem.line_total,
        total_items: cartItem.quantity,
      },
    });
  });
  await page.route("**/user/dashboard/me", (route) =>
    route.fulfill({
      json: { fullName: "Ana Tester", email: USER.email, tell: "3001234567" },
    }),
  );
  await page.route("**/user/addresses", (route) => route.fulfill({ json: [] }));
  await page.route("**/user/orders", (route) =>
    route.fulfill({ json: { id: "order-e2e-123" } }),
  );
}

test("flujo de compra: carrito, envío, pago y confirmación del pedido", async ({
  page,
}) => {
  await seedSession(page);
  await mockPurchaseApi(page);

  let orderPayload: Record<string, unknown> | null = null;
  await page.route("**/user/orders", async (route) => {
    orderPayload = route.request().postDataJSON();
    await route.fulfill({ json: { id: "order-e2e-123" } });
  });

  // Carrito con un producto.
  await page.goto("/carrito");
  await expect(
    page.getByRole("heading", { name: "Carrito de Compras" }),
  ).toBeVisible();
  await expect(page.getByText("Portátil Lubix Pro")).toBeVisible();
  await expect(page.getByText("$2.000.000")).toBeVisible();

  // Paso 1: datos de envío.
  await page.getByRole("button", { name: "Proceder al pago" }).click();
  await page.waitForURL("**/pago");
  await expect(
    page.getByRole("heading", { name: "Finalizar compra" }),
  ).toBeVisible();

  await page.getByPlaceholder("Juan Pérez").fill("Ana Tester");
  await page.getByPlaceholder("CC / NIT").fill("1020304050");
  await page.getByPlaceholder("tu@email.com").fill(USER.email);
  await page.getByPlaceholder("300 123 4567").fill("3001234567");
  await page.getByPlaceholder("Calle 123 #45-67").fill("Calle 10 #20-30");
  await page.getByPlaceholder("Bogotá").fill("Bogotá");
  await page.getByPlaceholder("Cundinamarca").fill("Cundinamarca");
  await page.getByPlaceholder("110111").fill("110111");

  await page.getByRole("button", { name: /Continuar al pago/ }).click();

  // Paso 2: tarjeta válida (Luhn) y fecha futura.
  await expect(
    page.getByRole("heading", { name: "Método de pago" }),
  ).toBeVisible();
  await page.getByPlaceholder("4111 1111 1111 1111").fill("4111111111111111");
  await page.getByPlaceholder("Como aparece en la tarjeta").fill("Ana Tester");
  await page.getByPlaceholder("MM/AA").fill("12/30");
  await page.getByPlaceholder("123").fill("123");

  await page.getByRole("button", { name: /Revisar compra/ }).click();

  // Paso 3: revisión y confirmación.
  await expect(
    page.getByRole("heading", { name: "Revisa y confirma tu compra" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Confirmar y pagar/ }).click();

  await expect(
    page.getByRole("heading", { name: "¡Pago exitoso!" }),
  ).toBeVisible();
  await expect(page.getByText("order-e2e-123")).toBeVisible();

  expect(orderPayload).toMatchObject({
    recipient: "Ana Tester",
    city: "Bogotá",
    department: "Cundinamarca",
    total: 2_000_000,
    payment_method: "tarjeta",
  });
});

test("flujo de compra: valida los datos de envío antes de avanzar", async ({
  page,
}) => {
  await seedSession(page);
  await mockPurchaseApi(page);

  await page.goto("/carrito");
  await page.getByRole("button", { name: "Proceder al pago" }).click();
  await page.waitForURL("**/pago");

  await page.getByRole("button", { name: /Continuar al pago/ }).click();

  await expect(page.getByText("El nombre es obligatorio")).toBeVisible();
  await expect(page.getByText("El correo es obligatorio")).toBeVisible();
  await expect(page.getByText("El teléfono es obligatorio")).toBeVisible();
  await expect(page.getByText("El documento es obligatorio")).toBeVisible();
  // Sigue en el paso de envío.
  await expect(
    page.getByRole("heading", { name: "Datos de envío" }),
  ).toBeVisible();
});
