from django.db import models
from django.contrib.auth.models import User


class StoreData(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='store_data')
    store_key = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'store_key')
        ordering = ['store_key']

    def __str__(self):
        return f'{self.user.username}:{self.store_key}'
