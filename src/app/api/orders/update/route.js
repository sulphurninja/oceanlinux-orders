import connectDB from '@/lib/db';
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export async function POST(request) {
    await connectDB();
    
    try {
        const { username, status, password, ipAddress, orderId, os } = await request.json();

        if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            return new Response(JSON.stringify({ message: 'Invalid order ID' }), { status: 400 });
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, {
            username,
            password,
            ipAddress,
 os: os || 'CentOS 7',
        status: status || 'pending'          
        }, { new: true });

        return new Response(JSON.stringify({ message: 'Order updated successfully', order: updatedOrder }), { status: 200 });

    } catch (error) {
        return new Response(JSON.stringify({ message: 'Error updating order', error: error.message }), { status: 500 });
    }
}
