import { createStackNavigator } from '@react-navigation/stack';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="BookList">
      <Stack.Screen name="BookList" component={BookListScreen} options={{ title: 'Bibliothèque' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Détail du Livre' }} />
    </Stack.Navigator>
  );
}

export default AppNavigator;