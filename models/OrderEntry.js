const mongoose = require('mongoose');

const OrderEntrySchema = new mongoose.Schema({
  order_ref_number: {
    type: String,
    required: [true, 'Order reference number is required'],
    index: true
  },
  scheme_code: {
    type: String,
    required: [true, 'Scheme code is required']
  },
  trxn_type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: ['P', 'R'] // Purchase or Redemption
  },
  buy_sell_type: {
    type: String,
    required: [true, 'Buy/Sell type is required']
  },
  client_code: {
    type: String,
    required: [true, 'Client code is required'],
    index: true
  },
  demat_physical: {
    type: String,
    required: [true, 'Demat/Physical flag is required']
  },
  order_amount: {
    type: String,
    required: [true, 'Order amount is required']
  },
  folio_no: String,
  remarks: String,
  kyc_flag: {
    type: String,
    required: [true, 'KYC flag is required'],
    enum: ['Y', 'N']
  },
  sub_broker_code: String,
  euin_number: String,
  euin_declaration: {
    type: String,
    enum: ['Y', 'N']
  },
  min_redemption_flag: {
    type: String,
    enum: ['Y', 'N']
  },
  dpc_flag: {
    type: String,
    enum: ['Y', 'N']
  },
  all_units: {
    type: String,
    enum: ['Y', 'N']
  },
  redemption_units: String,
  sub_broker_arn: String,
  bank_ref_no: String,
  account_no: String,
  mobile_no: String,
  email: String,
  mandate_id: String,
  send_2fa: String,
  send_comm: String,
  trxn_order_id: String,
  trxn_status: {
    type: String,
    default: 'PENDING'
  },
  trxn_remark: String,
  filler1: String
}, { 
  timestamps: true,
  strict: true // This ensures only defined fields are saved
});

// Add pre-save middleware to ensure order_amount is a valid number
OrderEntrySchema.pre('save', function(next) {
  if (this.order_amount && isNaN(this.order_amount)) {
    next(new Error('Order amount must be a valid number'));
  }
  next();
});

module.exports = mongoose.model('OrderEntry', OrderEntrySchema); 