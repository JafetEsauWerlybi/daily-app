import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useBackHandler } from '@/hooks/use-back-handler';
import { ConfirmModal } from '@/components/ConfirmModal';

const CATEGORY_COLORS: Record<string, string> = {
  Personal: '#9184d9',
  Salud: '#ff6b6b',
  Casa: '#4ecdc4',
  Pareja: '#ffe66d',
};

export default function HoyScreen() {
  const { user } = useAuth();
  const { tasks, loading, toggleTask, addTask } = useTasks(user?.uid);
  const [newTaskText, setNewTaskText] = useState('');

  // Manejar botón de regresar: navega por historial de tabs o pide confirmar salida
  const { exitModalVisible, confirmExit, cancelExit } = useBackHandler('hoy');

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user) return;

    await addTask({
      userId: user.uid,
      title: newTaskText,
      category: 'Personal',
      done: false,
    });
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string, done: boolean) => {
    toggleTask(taskId, done);
  };

  const today = new Date();
  const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][today.getDay()];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dateStr = `${dayName}, ${today.getDate()} ${months[today.getMonth()]}`;

  const activeTasks = tasks.filter((t) => !t.done);
  const completedCount = tasks.filter((t) => t.done).length;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9184d9" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-gray-700">
        <Text className="text-3xl text-white mb-1" style={{ fontFamily: 'MomoTrustSans-SemiBold' }}>
          Hoy
        </Text>
        <Text className="text-sm text-gray-400 mb-3" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
          {dateStr}
        </Text>
        <View className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
          <View
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </View>
        <Text className="text-xs text-gray-400" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
          {completedCount}/{tasks.length}
        </Text>
      </View>

      {/* Tasks List */}
      {activeTasks.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-base" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
            No hay tareas para hoy
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center py-3 border-b border-gray-800"
              onPress={() => handleToggleTask(item.id, item.done)}
              activeOpacity={0.7}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 border-purple-400 mr-3 justify-center items-center ${
                  item.done ? 'bg-purple-500' : ''
                }`}
              >
                {item.done && <FontAwesomeIcon icon={faCheck} size={12} color="#fff" />}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm text-gray-100 mb-1 ${item.done ? 'line-through text-gray-500' : ''}`}
                  style={{ fontFamily: 'MomoTrustSans-Medium' }}
                >
                  {item.title}
                </Text>
                <View className="flex-row items-center gap-2">
                  {item.category && (
                    <View
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: CATEGORY_COLORS[item.category] || '#9184d9' }}
                    >
                      <Text className="text-[11px] text-white" style={{ fontFamily: 'MomoTrustSans-Medium' }}>
                        {item.category}
                      </Text>
                    </View>
                  )}
                  {item.time && (
                    <Text className="text-[11px] text-gray-400" style={{ fontFamily: 'MomoTrustSans-Regular' }}>
                      {item.time}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
        />
      )}

      {/* Add Task Input */}
      <View className="flex-row px-5 py-3 border-t border-gray-700 gap-2">
        <TextInput
          className="flex-1 bg-slate-800 rounded-lg px-3 py-2.5 text-gray-100 text-sm border border-gray-700"
          placeholder="Nueva tarea..."
          placeholderTextColor="#666"
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          style={{ fontFamily: 'MomoTrustSans-Regular' }}
        />
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-purple-500 justify-center items-center"
          onPress={handleAddTask}
        >
          <FontAwesomeIcon icon={faPlus} size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={exitModalVisible}
        title="¿Seguro que quieres salir?"
        message="Se cerrará la aplicación Daily!"
        confirmText="Sí, salir"
        cancelText="Cancelar"
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </SafeAreaView>
  );
}
