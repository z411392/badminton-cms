<script lang="ts" setup>
import { type Timeslot } from '~/lib/modules/MeetupManaging/dtos/Timeslot'
import { type Level } from '~/lib/modules/LevelManaging/dtos/Level'
import TempVar from 'vue-temp-var'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Pie } from 'vue-chartjs'
import { type AttendingsStats } from '~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useSignUps'
import { type LevelsStats } from '~/composables/groups/[groupId]/meetups/[meetupId]/signUps/useSignUps'

onBeforeMount(() => ChartJS.register(ArcElement, Tooltip))

const { timeslots, attendingsStats, levelsStats, levels } = defineProps<{ timeslots: Timeslot[], attendingsStats: AttendingsStats, levelsStats: LevelsStats, levels: Level[] }>()
const stats = computed(() => timeslots.map(({ id: timeslotId, capacity, reserved }) => {
    const attendingsStat = attendingsStats[timeslotId]
    if (!attendingsStat) return undefined
    const { cancelled, revoked, refunded, accepted, paid, pending } = attendingsStat
    const available = capacity - reserved
    const unattending = cancelled + revoked + refunded
    const attending = accepted + paid
    const left = available - attending
    const excess = Math.max(pending + attending - available, 0)
    return {
        left,
        excess,
        waiting: pending,
        unpaid: accepted,
        unattending,
    }
}))

const allPieChartData = computed(() => timeslots.map(({ id: timeslotId }) => {
    const levelsStat = levelsStats[timeslotId]
    if (!levelsStat) return undefined
    const labels = levels.map(({ name }) => name)
    const backgroundColor = levels.map(({ color }) => color)
    const data = levels.map(({ id: levelId }) => levelsStat[levelId] || 0)
    return {
        labels,
        datasets: [
            {
                backgroundColor,
                data,
            }
        ],
    }
}))

const pieChartOptions = {
    responsive: false,
    maintainAspectRatio: false,
    elements: {
        arc: {
            borderWidth: 1,
        },
    },
}
</script>

<template>
    <v-bottom-navigation height="auto" bg-color="transparent" elevation="0" density="compact" dense
        style="position: fixed;">
        <v-row justify="center" density="compact" dense>
            <v-col cols="auto" dense>
                <v-expansion-panels density="compact" dense>
                    <template v-for="({ startTime, endTime }, index) in timeslots">
                        <TempVar :define="{
                            stat: stats[index],
                            data: allPieChartData[index],
                        }" #default="{
                            stat: { left, excess, waiting, unpaid, unattending },
                            data,
                        }" v-if="stats[index] && allPieChartData[index]">
                            <v-expansion-panel density="compact" dense>
                                <template #title>
                                    <v-row justify="space-between" :align="'center'" density="compact" dense>
                                        <v-col cols="auto" density="compact" dense>
                                            {{ startTime }} - {{ endTime }}
                                        </v-col>
                                        <v-col cols="auto" density="compact" dense>
                                            <Pie :data="data" :options="pieChartOptions" :class="$style.pie" />
                                        </v-col>
                                        <v-spacer />
                                        <v-col cols="auto" density="compact" dense>
                                            還有 {{ left }} 個名額 ／
                                            <template v-if="excess"> {{ excess }} 人候補中 </template>
                                            <template v-else> {{ waiting }} 人等待中 </template>
                                        </v-col>
                                    </v-row>
                                </template>
                                <template #text>
                                    <v-table>
                                        <tbody>
                                            <tr>
                                                <th>未收款</th>
                                                <td>{{ unpaid }}</td>
                                            </tr>
                                            <tr>
                                                <th>已取消</th>
                                                <td>{{ unattending }}</td>
                                            </tr>
                                        </tbody>
                                    </v-table>
                                </template>
                            </v-expansion-panel>
                        </TempVar>
                    </template>
                </v-expansion-panels>
            </v-col>
        </v-row>
    </v-bottom-navigation>
</template>

<style scoped module>
.pie {
    width: 100% !important;
    height: auto !important;
    max-width: 24px;
}
</style>