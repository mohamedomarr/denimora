# Django Admin Enhancements for Orders

## New Features Added

### 1. **Total Cost per Item Display**
- **Location**: Order detail page → Order items inline table
- **Feature**: Shows calculated total cost (price × quantity) for each item
- **Column**: "Item Total" showing amount in LE (Egyptian Pounds)
- **Benefit**: Admins can quickly see the total value of each item line

### 2. **Dynamic Shipping Costs by Governorate**
- **NEW**: Shipping cost now calculated based on customer's governorate
- **Admin Management**: "Governorate Shipping Rates" section in admin
- **Default Cost**: 100 LE (maintained for compatibility)
- **Customizable**: Admins can set different shipping costs per governorate
- **Fallback**: If governorate not found or inactive, uses default 100 LE

### 3. **Order Total Cost Calculations**
- **Items Total**: Subtotal of all items in the order
- **Dynamic Shipping Cost**: Based on customer's governorate (or default 100 LE)
- **Total with Shipping**: Final order total including dynamic shipping
- **Display**: Both in admin list view and detailed order view
- **Shipping Info**: Shows governorate name in admin for reference

### 4. **Receipt Printing Functionality**
- **Admin Action**: "Print receipt for selected order" 
- **Individual Orders**: "Print Receipt" button in order detail view
- **Features**:
  - Professional receipt layout
  - Company branding (DENIMORA)
  - Complete order details
  - Itemized list with totals
  - Dynamic shipping cost display
  - Shipping and grand total breakdown
  - Print-optimized CSS

## How to Use

### Managing Shipping Costs:
1. Go to **Django Admin → Orders → Governorate Shipping Rates**
2. View all 27 Egyptian governorates (auto-populated)
3. Edit shipping costs for specific governorates
4. Enable/disable shipping to certain areas using "Is active" field
5. Changes apply immediately to new orders

### In Order List View:
1. New columns show: Items Total, Shipping Cost (with governorate), Total (with Shipping)
2. Select one order and choose "Print receipt" from Actions dropdown
3. **NEW**: Governorate column shows customer's location

### In Order Detail View:
1. "Order Totals" section shows all cost breakdowns
2. **NEW**: Governorate field in "Shipping Address" section
3. Click "Print Receipt" button to open printable receipt
4. Each order item shows individual total cost

### Receipt Printing:
1. Receipt opens in new tab/window
2. Optimized for A4 printing
3. Print button and close button included
4. Professional formatting with company branding
5. **NEW**: Shows actual shipping cost based on governorate

## Technical Details

### Files Modified:
- `orders/models.py`: Added GovernorateShipping model and dynamic shipping calculation
- `orders/admin.py`: Enhanced admin interface with governorate management
- `orders/views.py`: Updated receipt printing view
- `orders/urls.py`: Added receipt URL pattern
- `templates/admin/orders/order_receipt.html`: Enhanced receipt template
- `api/orders/serializers.py`: Updated to handle governorate field mapping

### New Models:
- **GovernorateShipping**: Manages shipping costs per governorate
  - `name`: Governorate name (unique)
  - `shipping_cost`: Cost in LE
  - `is_active`: Whether shipping is available
  - `created/updated`: Timestamps

### Database Changes:
- **Order.governorate**: New field to store customer's governorate
- **Migration**: `0004_governorateshipping_order_governorate.py`

### API Updates:
- Frontend `state` field mapped to backend `governorate` field
- API responses include `shipping_cost` and `total_cost_with_shipping`
- Dynamic shipping calculation in order creation

### Management Commands:
- `python manage.py populate_governorates`: Populates all 27 governorates with default costs

### Constants:
- `DEFAULT_SHIPPING_FEE = 100` LE (fallback when governorate not found)

### New Model Methods:
- `GovernorateShipping.get_shipping_cost(governorate_name)`: Static method for cost lookup
- `Order.get_shipping_cost()`: Returns dynamic shipping cost based on governorate
- `Order.get_total_cost_with_shipping()`: Returns total including dynamic shipping
- Enhanced `OrderItem.__str__()`: Now includes item total cost

## Pre-populated Governorates

All 27 Egyptian governorates are automatically created with 100 LE default shipping:

**Major Cities**: Cairo, Giza, Alexandria  
**Delta Region**: Dakahlia, Beheira, Gharbiya, Menofia, Qaliubiya, Kafr Al sheikh, Damietta, Sharkia  
**Upper Egypt**: Aswan, Assiut, Luxor, Qena, Sohag, Minya, Beni Suef  
**Coastal Areas**: Red Sea, Matrouh  
**Sinai**: South Sinai, North Sinai  
**Other**: Fayoum, Ismailia, New Valley, Suez, Port Said  

## Benefits

1. **Dynamic Pricing**: Different shipping costs for different regions
2. **Admin Control**: Easy management of shipping rates
3. **Better Visibility**: Admins can see governorate-specific costs
4. **Professional Receipts**: Print receipts with accurate shipping information
5. **Consistent API**: Frontend and backend use same governorate data
6. **Fallback Safety**: Default cost ensures system never breaks
7. **Enhanced UX**: Streamlined order management workflow
8. **No Breaking Changes**: All existing functionality preserved
9. **Scalable**: Easy to add new governorates or modify costs 