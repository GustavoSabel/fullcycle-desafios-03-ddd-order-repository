import Order from "../../../../domain/checkout/entity/order";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderItem from "../../../../domain/checkout/entity/order_item";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.sequelize.transaction(async (transaction) => {
      const originalOrder = await OrderModel.findByPk(entity.id, {
        include: ["items"],
        transaction,
      });

      await originalOrder
        .set({
          customer_id: entity.customerId,
          total: entity.total(),
        })
        .save({ transaction });

      // Remove itens that are not in the new order
      const itemsToRemove = originalOrder.items.filter(
        (item) => !entity.items.some((i) => i.id === item.id)
      );
      for (const itemToDelete of itemsToRemove) {
        await itemToDelete.destroy({ transaction });
      }

      for (const item of entity.items) {
        const originalItem = originalOrder.items.find(
          (originalItem) => originalItem.id === item.id
        );

        if (!originalItem) {
          // Create new item
          await OrderItemModel.create(
            {
              id: item.id,
              name: item.name,
              price: item.price,
              product_id: item.productId,
              quantity: item.quantity,
              order_id: originalOrder.id,
            },
            { transaction }
          );
        } else {
          // Update item
          await originalItem
            .set({
              name: item.name,
              price: item.price,
              product_id: item.productId,
              quantity: item.quantity,
            })
            .save({ transaction });
        }
      }
    });
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findByPk(id, { include: ["items"] });
    if (!orderModel) {
      throw new Error("Order not found");
    }
    return this.mapOrderModelToEntity(orderModel);
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({ include: ["items"] });
    return orderModels.map(this.mapOrderModelToEntity);
  }

  private mapOrderModelToEntity(orderModel: OrderModel): Order {
    return new Order(
      orderModel.id,
      orderModel.customer_id,
      orderModel.items.map(
        (itemModel) =>
          new OrderItem(
            itemModel.id,
            itemModel.name,
            itemModel.price,
            itemModel.product_id,
            itemModel.quantity
          )
      )
    );
  }
}
