from django.contrib import admin
from .models import StoreData


@admin.register(StoreData)
class StoreDataAdmin(admin.ModelAdmin):
    list_display = ('user', 'store_key', 'updated_at')
    search_fields = ('user__username', 'store_key')
