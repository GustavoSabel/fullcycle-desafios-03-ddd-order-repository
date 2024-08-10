import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer1 = new Customer("1", "Customer 1");
    customer1.changeAddress(new Address("Street 1", 1, "Zipcode 1", "City 1"));
    await customerRepository.create(customer1);
    const customer2 = new Customer("2", "Customer 2");
    customer2.changeAddress(new Address("Street 2", 2, "Zipcode 2", "City 2"));
    await customerRepository.create(customer2);

    const productRepository = new ProductRepository();
    const product1 = new Product("1", "Product 1", 10);
    await productRepository.create(product1);
    const product2 = new Product("2", "Product 2", 20);
    await productRepository.create(product2);
    const product3 = new Product("3", "Product 3", 30);
    await productRepository.create(product3);

    const orderItem1 = new OrderItem(
      "1",
      product1.name,
      product1.price,
      product1.id,
      2
    );

    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    const order = new Order("123", customer1.id, [orderItem1, orderItem2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    order.changeCustomerId(customer2.id);
    order.removeItem(orderItem2.id);
    orderItem1.incrementQuantity(1);
    order.updateItem(orderItem1);
    const orderItem3 = new OrderItem(
      "3",
      product3.name,
      product3.price,
      product3.id,
      3
    );
    order.addNewItem(orderItem3);

    await orderRepository.update(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });
    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: customer2.id,
      total: order.total(),
      items: [
        {
          id: orderItem1.id,
          name: orderItem1.name,
          price: orderItem1.price,
          quantity: orderItem1.quantity,
          order_id: order.id,
          product_id: product1.id,
        },
        {
          id: orderItem3.id,
          name: orderItem3.name,
          price: orderItem3.price,
          quantity: orderItem3.quantity,
          order_id: order.id,
          product_id: product3.id,
        },
      ],
    });
  });

  it("should throw an error when order is not found", async () => {
    const orderRepository = new OrderRepository();

    await expect(async () => {
      await orderRepository.find("423442342");
    }).rejects.toThrow("Order not found");
  });

  it("should find an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    customer.changeAddress(new Address("Street 1", 1, "Zipcode 1", "City 1"));
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundOrder = await orderRepository.find(order.id);

    expect(foundOrder).toStrictEqual(order);
    expect(foundOrder.total()).toBe(order.total());
    expect(foundOrder.items.length).toBe(order.items.length);
    expect(foundOrder.items[0]).toStrictEqual(order.items[0]);
  });

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("1", "Customer 1");
    customer.changeAddress(new Address("Street 1", 1, "Zipcode 1", "City 1"));
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundOrders = await orderRepository.findAll();

    expect(foundOrders.length).toBe(1);
    expect(foundOrders[0]).toStrictEqual(order);
    expect(foundOrders[0].total()).toBe(order.total());
    expect(foundOrders[0].items.length).toBe(order.items.length);
    expect(foundOrders[0].items[0]).toStrictEqual(order.items[0]);
  });
});
