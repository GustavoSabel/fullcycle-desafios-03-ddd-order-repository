import OrderItem from "./order_item";
export default class Order {
  private _id: string;
  private _customerId: string;
  private _items: OrderItem[];

  constructor(id: string, customerId: string, items: OrderItem[]) {
    this._id = id;
    this._customerId = customerId;
    this._items = items;
    this.validate();
  }

  get id(): string {
    return this._id;
  }

  get customerId(): string {
    return this._customerId;
  }

  get items(): OrderItem[] {
    return this._items;
  }

  changeCustomerId(customerId: string) {
    this._customerId = customerId;
  }

  updateItem(item: OrderItem) {
    const index = this._items.findIndex((i) => i.id === item.id);
    if (index === -1) {
      throw new Error("Item not found");
    }
    this._items[index] = item;
  }

  removeItem(id: string) {
    this._items = this._items.filter((item) => item.id !== id);
  }

  addNewItem(orderItem3: OrderItem) {
    this._items.push(orderItem3);
  }

  validate(): boolean {
    if (this._id.length === 0) {
      throw new Error("Id is required");
    }
    if (this._customerId.length === 0) {
      throw new Error("CustomerId is required");
    }
    if (this._items.length === 0) {
      throw new Error("Items are required");
    }

    if (this._items.some((item) => item.quantity <= 0)) {
      throw new Error("Quantity must be greater than 0");
    }

    return true;
  }

  total(): number {
    return this._items.reduce((acc, item) => acc + item.total(), 0);
  }
}
