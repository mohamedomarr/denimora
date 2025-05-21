from django import forms
from .models import Order

class OrderCreateForm(forms.ModelForm):
    class Meta:
        model = Order
        fields = ['first_name', 'last_name', 'email', 'address', 'city', 'postal_code', 'phone']
        
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Pre-fill form with user data if authenticated
        if user and user.is_authenticated:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['email'].initial = user.email
            
            # Pre-fill with profile data if available
            if hasattr(user, 'profile'):
                self.fields['address'].initial = user.profile.address
                self.fields['city'].initial = user.profile.city
                self.fields['postal_code'].initial = user.profile.postal_code
                self.fields['phone'].initial = user.profile.phone
