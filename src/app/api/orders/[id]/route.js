import connectDB from '@/lib/db';
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export async function DELETE(req, { params }) {
  // `params.id` will be the orderId from the URL
  const { id } = params;

  await connectDB();

  try {
    await Order.findByIdAndDelete(id);

    return new Response(
      JSON.stringify({ message: 'Deleted successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to delete order', error: error.message }),
      { status: 500 }
    );
  }
}
