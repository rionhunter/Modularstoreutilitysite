import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CheckSquare, Plus, Trash2, AlertCircle, Calendar, Archive, CheckCircle2, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  category: string;
  createdAt: Date;
  completed: boolean;
  completedAt?: Date;
  alertDays: number;
  lastAlertShown?: Date;
  dirtyItems?: Array<{
    barcode: string;
    location: string;
  }>;
}

const TASK_CATEGORIES = [
  { value: 'daily', label: 'Daily Tasks', color: 'bg-blue-500' },
  { value: 'weekly', label: 'Weekly Tasks', color: 'bg-green-500' },
  { value: 'monthly', label: 'Monthly Tasks', color: 'bg-purple-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
  { value: 'admin', label: 'Admin', color: 'bg-pink-500' },
];

export function TaskTrackerModule() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((t: Task) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        lastAlertShown: t.lastAlertShown ? new Date(t.lastAlertShown) : undefined,
      }));
    }
    return [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('daily');
  const [newTaskAlertDays, setNewTaskAlertDays] = useState('7');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    // Save tasks to localStorage
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    // Listen for task updates from other components
    const handleTasksUpdated = () => {
      const saved = localStorage.getItem('tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        setTasks(parsed.map((t: Task) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
          lastAlertShown: t.lastAlertShown ? new Date(t.lastAlertShown) : undefined,
        })));
      }
    };
    
    window.addEventListener('tasks-updated', handleTasksUpdated);
    return () => window.removeEventListener('tasks-updated', handleTasksUpdated);
  }, []);

  useEffect(() => {
    // Check for tasks that need alerts - runs on mount and every minute
    const checkAlerts = () => {
      const now = new Date();
      const tasksToAlert: string[] = [];
      
      tasks.forEach(task => {
        if (!task.completed) {
          const daysSinceCreated = Math.floor(
            (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Only show alert if task is overdue AND we haven't shown an alert in the last 12 hours
          if (daysSinceCreated >= task.alertDays) {
            const lastAlert = task.lastAlertShown ? new Date(task.lastAlertShown) : null;
            const hoursSinceLastAlert = lastAlert 
              ? (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60)
              : Infinity;
            
            // Show alert if no previous alert or last alert was more than 12 hours ago
            if (hoursSinceLastAlert >= 12) {
              const category = TASK_CATEGORIES.find(c => c.value === task.category);
              toast.error(`Task Alert: ${task.title}`, {
                description: `This ${category?.label.toLowerCase()} task was created ${daysSinceCreated} days ago and needs attention.`,
                action: {
                  label: 'Mark Done',
                  onClick: () => {
                    setTasks(prev =>
                      prev.map(t =>
                        t.id === task.id 
                          ? { ...t, completed: true, completedAt: new Date() } 
                          : t
                      )
                    );
                    toast.success('Task completed!', {
                      description: `"${task.title}" has been marked as done and archived.`,
                    });
                  },
                },
                duration: 10000,
              });
              
              tasksToAlert.push(task.id);
            }
          }
        }
      });
      
      // Update last alert time for all alerted tasks
      if (tasksToAlert.length > 0) {
        setTasks(prev => 
          prev.map(t => 
            tasksToAlert.includes(t.id) ? { ...t, lastAlertShown: now } : t
          )
        );
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: newTaskCategory,
      createdAt: new Date(),
      completed: false,
      alertDays: parseInt(newTaskAlertDays) || 7,
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setDialogOpen(false);
    toast.success('Task added successfully');
  };

  const markTaskDone = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId 
          ? { ...task, completed: true, completedAt: new Date() } 
          : task
      )
    );
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      toast.success('Task completed!', {
        description: `"${task.title}" has been marked as done and archived.`,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast.success('Task deleted');
  };

  const restoreTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId 
          ? { ...task, completed: false, completedAt: undefined, createdAt: new Date() } 
          : task
      )
    );
    toast.success('Task restored to active tasks');
  };

  const getDaysSince = (date: Date) => {
    const now = new Date();
    return Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeTasks = tasks.filter(t => !t.completed);
  const archivedTasks = tasks.filter(t => t.completed).sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime; // Most recent first
  });

  const filteredActiveTasks = filterCategory === 'all'
    ? activeTasks
    : activeTasks.filter(task => task.category === filterCategory);

  const filteredArchivedTasks = filterCategory === 'all'
    ? archivedTasks
    : archivedTasks.filter(task => task.category === filterCategory);

  const getCategoryColor = (category: string) => {
    return TASK_CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const pendingAlerts = activeTasks.filter(task => {
    const daysSince = getDaysSince(task.createdAt);
    return daysSince >= task.alertDays;
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Tracker
              {pendingAlerts > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <Bell className="h-3 w-3" />
                  {pendingAlerts}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Manage tasks with automated alerts</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Create a test task that's already overdue
                const testTask: Task = {
                  id: Date.now().toString(),
                  title: 'Test Overdue Task',
                  category: 'daily',
                  createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
                  completed: false,
                  alertDays: 7,
                };
                setTasks(prev => [...prev, testTask]);
                toast.success('Created test overdue task', {
                  description: 'Check for notification alert!',
                });
              }}
              title="Create test overdue task"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task description"
                    className="mt-1"
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                  />
                </div>
                <div>
                  <Label htmlFor="task-category">Category</Label>
                  <Select value={newTaskCategory} onValueChange={setNewTaskCategory}>
                    <SelectTrigger id="task-category" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="alert-days">Alert After (days)</Label>
                  <Input
                    id="alert-days"
                    type="number"
                    value={newTaskAlertDays}
                    onChange={e => setNewTaskAlertDays(e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <Button onClick={addTask} className="w-full">
                  Create Task
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Filter by Category</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TASK_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="gap-2">
              Active
              {activeTasks.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {activeTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Archive className="h-4 w-4" />
              Archive
              {archivedTasks.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5">
                  {archivedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-2">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredActiveTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active tasks. Create one to get started.
                </div>
              ) : (
                filteredActiveTasks.map(task => {
                  const daysSince = getDaysSince(task.createdAt);
                  const needsAlert = daysSince >= task.alertDays;

                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => markTaskDone(task.id)}
                        title="Mark as done"
                      >
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm">
                            {task.title}
                          </span>
                          <div className={`h-2 w-2 rounded-full ${getCategoryColor(task.category)}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{daysSince} days ago</span>
                          {needsAlert && (
                            <Badge variant="destructive" className="h-5 text-xs gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Alert
                            </Badge>
                          )}
                        </div>
                        {task.dirtyItems && task.dirtyItems.length > 0 && (
                          <div className="mt-2 text-xs">
                            <div className="text-muted-foreground mb-1">Items to clean:</div>
                            <div className="space-y-1">
                              {task.dirtyItems.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <span className="font-mono">{item.barcode}</span>
                                  <span className="text-muted-foreground">@{item.location}</span>
                                </div>
                              ))}
                              {task.dirtyItems.length > 3 && (
                                <div className="text-muted-foreground">
                                  +{task.dirtyItems.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Total: {filteredActiveTasks.length}</span>
              <span className="text-destructive">Alerts: {filteredActiveTasks.filter(t => getDaysSince(t.createdAt) >= t.alertDays).length}</span>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-2">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredArchivedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No archived tasks yet.
                </div>
              ) : (
                filteredArchivedTasks.map(task => {
                  const daysActive = task.completedAt 
                    ? getDaysSince(task.createdAt) - getDaysSince(task.completedAt)
                    : 0;

                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm line-through text-muted-foreground">
                            {task.title}
                          </span>
                          <div className={`h-2 w-2 rounded-full ${getCategoryColor(task.category)}`} />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                          <div>Completed: {task.completedAt ? formatDate(task.completedAt) : 'Unknown'}</div>
                          <div>Active for: {daysActive} days</div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => restoreTask(task.id)}
                          title="Restore task"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground border-t pt-4">
              <span>Archived: {filteredArchivedTasks.length}</span>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
