<script lang="ts" setup>
import { type Plan } from '~/lib/modules/MeetupManaging/dtos/Plan'
import { type SignUpEnriched } from '~/lib/modules/SignUpManaging/presentation/controllers/onRetrievingSignUp'
import { type Level } from '~/lib/modules/LevelManaging/dtos/Level'
import { SignUpStatuses } from '~/lib/modules/SignUpManaging/dtos/SignUpStatuses'
import TempVar from 'vue-temp-var'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'
import { Pie } from 'vue-chartjs'

onBeforeMount(() => ChartJS.register(ArcElement, Tooltip))

const { plans, signUps, levels } = defineProps<{ plans: Plan[], signUps: SignUpEnriched[], levels: Level[] }>()

const initializeAttendingStats = () => plans.map(() => {
    const attendingStat: { [status: string]: number } = {}
    for (const status of Object.values(SignUpStatuses)) attendingStat[status] = 0
    return attendingStat
})

const processAttendingStats = (attendingStats: Array<{ [status: string]: number }>) => {
    for (const { statuses } of signUps) {
        for (const index in statuses) attendingStats[Number(index)][statuses[index]] += 1
    }
    return attendingStats
}

const fromAttendingStatToStatWeNeed = (attendingStat: { [status: string]: number }, index: number) => {
    const { cancelled, revoked, refunded, accepted, paid, pending } = attendingStat
    const { capacity, reserved } = plans[index]
    const left = capacity - reserved
    const unattending = cancelled + revoked + refunded
    const attending = accepted + paid
    const excess = Math.max(pending + attending - left, 0)
    return {
        left: Math.max(left - attending, 0),
        excess,
        waiting: pending,
        unpaid: accepted,
        unattending,
    }
}

const stats = computed(() => processAttendingStats(initializeAttendingStats()).map(fromAttendingStatToStatWeNeed))

const initializeLevelStats = () => plans.map(() => {
    const levelStat: { [levelId: string]: number } = {}
    for (const { id: levelId } of levels) levelStat[levelId] = 0
    return levelStat
})

const processLevelStats = (levelStats: Array<{ [levelId: string]: number }>) => {
    for (const { statuses, profile: { levelId } } of signUps) {
        for (const index in statuses) {
            const status = statuses[index]
            if (status === SignUpStatuses.Accepted || status === SignUpStatuses.Paid) levelStats[Number(index)][levelId] += 1
        }
    }
    return levelStats
}

const fromLevelStatToPieChartData = (levelStat: { [levelId: string]: number }) => {
    return {
        labels: levels.map(({ name }) => name),
        datasets: [
            {
                backgroundColor: levels.map(({ color }) => color),
                data: levels.map(({ id: levelId }) => levelStat[levelId]),
            }
        ],
    }
}

const allPieChartData = computed(() => processLevelStats(initializeLevelStats()).map(fromLevelStatToPieChartData))

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
    <v-bottom-navigation height="auto" bg-color="transparent" elevation="0" density="compact" dense>
        <v-container density="compact" dense>
            <v-row justify="center" density="compact" dense>
                <v-col cols="auto" density="compact" dense>
                    <v-expansion-panels density="compact" dense>
                        <template v-for="({ startTime, endTime }, index) in plans">
                            <TempVar :define="{
                                stat: stats[index],
                                data: allPieChartData[index],
                            }" #default="{
                                stat: { left, excess, waiting, unpaid, unattending },
                                data,
                            }">
                                <v-expansion-panel density="compact" dense>
                                    <template #title>
                                        <v-container density="compact" dense>
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
                                        </v-container>
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
        </v-container>
    </v-bottom-navigation>
</template>

<style scoped module>
.pie {
    width: 100% !important;
    height: auto !important;
    max-width: 24px;
}
</style>