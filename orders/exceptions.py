class InsufficientStockError(Exception):
    """
    Exception raised when there is insufficient stock for an order item.
    """
    def __init__(self, product_name, size_name, requested_quantity, available_quantity):
        self.product_name = product_name
        self.size_name = size_name
        self.requested_quantity = requested_quantity
        self.available_quantity = available_quantity
        
        # Create a user-friendly message
        if size_name:
            message = f"Insufficient stock for '{product_name}' in size '{size_name}'. Requested: {requested_quantity}, Available: {available_quantity}"
        else:
            message = f"Insufficient stock for '{product_name}'. Requested: {requested_quantity}, Available: {available_quantity}"
            
        super().__init__(message)
