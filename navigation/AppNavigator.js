import { createStackNavigator } from '@react-navigation/stack';
import BookListScreen from '../screens/BookListScreen';
import BookDetailScreen from '../screens/BookDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="BookList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BookList" component={BookListScreen} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;