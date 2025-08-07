import { defineStore } from 'pinia';

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    orders: [],
  }),
  actions: {
    async createOrder(order) {
      const supabase = useSupabaseClient();
      try {
        const { data, error } = await supabase.from('orders').insert([order]);
        if (error) throw error;
        this.orders.push(data[0]);
      } catch (error) {
        console.error('Error creating order:', error.message);
      }
    },
  },
});