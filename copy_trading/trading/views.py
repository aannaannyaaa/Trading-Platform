from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Trade
from .serializers import UserSerializer, TradeSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.all()
    serializer_class = TradeSerializer
