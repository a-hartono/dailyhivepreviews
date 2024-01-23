<script>
document.addEventListener('DOMContentLoaded', function() {
    var excludedDates = [];

    // Function to add a new task
    window.addTask = function() {
        const tasksContainer = document.getElementById('tasksContainer');
        const newTask = document.createElement('div');
        newTask.className = 'task';
        newTask.innerHTML = `
            <input type="text" class="taskName" placeholder="Task Name">
            <input type="text" class="taskOwner" placeholder="Task Owner">
            <input type="number" class="taskDuration" placeholder="Duration (days)">
            <label><input type="checkbox" class="taskDependency"> Dependent on previous task</label>
            <button onclick="removeTask(this)">Remove</button>
        `;
        tasksContainer.appendChild(newTask);
    };

    // Function to remove a task
    window.removeTask = function(button) {
        const task = button.parentNode;
        task.parentNode.removeChild(task);
    };

    // Function to add excluded date
    window.addExcludedDate = function() {
        const excludedDate = document.getElementById('excludedDates').value;
        if (excludedDate && !excludedDates.includes(excludedDate)) {
            excludedDates.push(excludedDate);
            updateExcludedDatesDisplay();
        }
    };

    // Function to update the display of excluded dates
    function updateExcludedDatesDisplay() {
        const list = document.getElementById('excludedDatesDisplay');
        list.innerHTML = '';
        excludedDates.forEach(function(date) {
            const listItem = document.createElement('li');
            listItem.textContent = date;
            list.appendChild(listItem);
        });
    }

    // Function to check if two dates are the same
    function isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    // Function to check if a day is valid (not a weekend or excluded date)
    function isDayValid(date) {
        const excludeWeekends = document.getElementById('excludeWeekends').checked;
        if (excludeWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
            return false; // It's a weekend
        }
        return !excludedDates.some(excludedDate => isSameDate(new Date(excludedDate), date)); // Check for excluded dates
    }

    // Function to adjust date to next valid day if it's not valid
    function adjustToNextValidDay(date, moveBackward = false) {
        while (!isDayValid(date)) {
            date.setDate(date.getDate() + (moveBackward ? -1 : 1));
        }
        return date;
    }

    // Function to calculate the schedule
    window.calculateSchedule = function() {
        const endDate = new Date(document.getElementById('projectEndDate').value);
        let tasks = Array.from(document.querySelectorAll('.task'));
        let taskDetails = [];
        let currentEndDate = adjustToNextValidDay(new Date(endDate), true);

        for (let i = tasks.length - 1; i >= 0; i--) {
            const task = tasks[i];
            const taskName = task.querySelector('.taskName').value;
            const taskOwner = task.querySelector('.taskOwner').value;
            const taskDuration = parseInt(task.querySelector('.taskDuration').value);

            let taskEndDate = new Date(currentEndDate);
            let taskStartDate = new Date(taskEndDate);

            taskStartDate.setDate(taskStartDate.getDate() - (taskDuration - 1));
            taskStartDate = adjustToNextValidDay(taskStartDate, true);

            taskDetails.unshift({ name: taskName, owner: taskOwner, startDate: new Date(taskStartDate), endDate: new Date(taskEndDate) });

            // Update current end date for the next (actually previous) task
            currentEndDate = new Date(taskStartDate);
            currentEndDate.setDate(currentEndDate.getDate() - 1);
            currentEndDate = adjustToNextValidDay(currentEndDate, true);
        }

        // Update the table and kick-off date display
        updateTableDisplay(taskDetails);
        updateKickoffDateDisplay(taskDetails);
        updateTaskScheduleDisplay(taskDetails);
                drawGanttChart(taskDetails); // Function to draw Gantt chart
    };
 // Function to draw the Gantt chart
    function drawGanttChart(taskDetails) {
        google.charts.load('current', {'packages':['gantt']});
        google.charts.setOnLoadCallback(function() {
            var data = new google.visualization.DataTable();
            data.addColumn('string', 'Task ID');
            data.addColumn('string', 'Task Name');
            data.addColumn('date', 'Start Date');
            data.addColumn('date', 'End Date');
            data.addColumn('number', 'Duration');
            data.addColumn('number', 'Percent Complete');
            data.addColumn('string', 'Dependencies');

            var ganttData = taskDetails.map((task, index) => [
                'Task ' + (index + 1),
                task.name,
                task.startDate,
                task.endDate,
                null, // Duration, automatically calculated
                100, // Assuming tasks are 100% complete for demo purposes
                null // Dependencies, can be added based on your logic
            ]);

            data.addRows(ganttData);

            var options = {
                height: 400,
                gantt: {
                    trackHeight: 30
                }
            };

            var chart = new google.visualization.Gantt(document.getElementById('chart_div'));
            chart.draw(data, options);
        });
    }

    function updateTaskScheduleDisplay(taskDetails) {
        const list = document.getElementById('taskList');
        list.innerHTML = ''; // Clear current task list

        taskDetails.forEach((task, index) => {
            const listItem = document.createElement('li');

            const taskNumber = document.createElement('span');
            taskNumber.textContent = `Task #${index + 1}`;
            listItem.appendChild(taskNumber);

            const taskName = document.createElement('span');
            taskName.textContent = `Name: ${task.name}`;
            listItem.appendChild(taskName);

            const taskOwner = document.createElement('span');
            taskOwner.textContent = `Owner: ${task.owner}`;
            listItem.appendChild(taskOwner);

            const startDate = document.createElement('span');
            startDate.textContent = `Start Date: ${task.startDate.toDateString()}`;
            listItem.appendChild(startDate);

            const endDate = document.createElement('span');
            endDate.textContent = `End Date: ${task.endDate.toDateString()}`;
            listItem.appendChild(endDate);

            list.appendChild(listItem);
        });
    }

    function updateTableDisplay(taskDetails) {
        const tableBody = document.getElementById('taskTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        taskDetails.forEach((task, index) => {
            let row = tableBody.insertRow();

            let cellTaskNumber = row.insertCell(0);
            let cellTaskName = row.insertCell(1);
            let cellTaskOwner = row.insertCell(2);
            let cellStartDate = row.insertCell(3);
            let cellEndDate = row.insertCell(4);

            cellTaskNumber.innerHTML = index + 1;
            cellTaskName.innerHTML = task.name;
            cellTaskOwner.innerHTML = task.owner;
            cellStartDate.innerHTML = task.startDate.toDateString();
            cellEndDate.innerHTML = task.endDate.toDateString();
        });
    }

    function updateKickoffDateDisplay(taskDetails) {
        let kickoffDate = taskDetails.length > 0 ? taskDetails[0].startDate : new Date();
        document.getElementById('kickoffDate').textContent = kickoffDate.toDateString();
    }

    // Function to reset the schedule
    window.resetSchedule = function() {
        document.getElementById('tasksContainer').innerHTML = '';
        excludedDates = [];
        updateExcludedDatesDisplay();
        const tableBody = document.getElementById('taskTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        document.getElementById('kickoffDate').textContent = '';
        document.getElementById('projectEndDate').value = '';
        document.getElementById('excludeWeekends').checked = false;
    };
});
</script>