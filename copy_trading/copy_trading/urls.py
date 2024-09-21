from django.urls import path, include
from rest_framework.routers import DefaultRouter
from trading.views import UserViewSet, TradeViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'trades', TradeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

