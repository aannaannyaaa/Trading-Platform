from django.contrib.auth.models import User
from django.db import models

class Trade(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symbol = models.CharField(max_length=10)
    quantity = models.FloatField()
    price = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} traded {self.quantity} of {self.symbol} at {self.price}"
