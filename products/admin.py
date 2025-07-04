from django.contrib import admin
from .models import Category, Product, Size, ProductSize, ProductImage 

admin.site.site_header = "DENIMORA Admin Dashboard"
admin.site.index_title = "Admin Settings"

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ['name', 'order']
    list_editable = ['order']

class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'price', 'stock', 'available', 'created', 'updated']
    list_filter = ['available', 'created', 'updated', 'category']
    list_editable = ['price', 'stock', 'available']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']
    raw_id_fields = ['category']
    date_hierarchy = 'created'
    ordering = ['name']
    inlines = [ProductSizeInline, ProductImageInline]
    filter_horizontal = ['sizes']

@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'stock']
    list_filter = ['product', 'size']
    list_editable = ['stock']
    search_fields = ['product__name', 'size__name']
