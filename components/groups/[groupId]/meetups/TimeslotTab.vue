<script lang="ts" setup>
import * as validators from "~/lib/modules/MeetupManaging/presentation/validators/Timeslot"
import { time as timeValidator } from "~/lib/utils/validators"

const courts = defineModel<string | number>("courts")
const courtsRules = [
    (value: string | number) => {
        const { error } = validators.courts.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]

const capacity = defineModel<string | number>("capacity")
const capacityRules = [
    (value: string | number) => {
        const { error } = validators.capacity.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]
const reserved = defineModel<string | number>("reserved")
const reservedRules = [
    (value: string | number) => {
        const { error } = validators.reserved.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]

const fee = defineModel<string | number>("fee")
const feeRules = [
    (value: string | number) => {
        const { error } = validators.fee.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]

const startTime = defineModel<string>("startTime")
const startTimeRules = [
    (value: string) => {
        const { error } = timeValidator.validate(value)
        if (error) return error.message
        return true
    },
]
const endTime = defineModel<string>("endTime")
const endTimeRules = [
    (value: string) => {
        const { error } = timeValidator.validate(value)
        if (error) return error.message
        return true
    },
]

const timestamp = defineModel<string | number>("timestamp")
</script>

<template>
    <v-container>
        <v-row>
            <v-col :cols="12" :sm="6" v-show="false">
                <v-text-field v-model.number="timestamp" type="number" v-show="false" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="場地面數" v-model.number="courts" clearable :rules="courtsRules" density="compact"
                    variant="underlined" type="number" step="1" min="1" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="總人數" v-model.number="capacity" clearable :rules="capacityRules" density="compact"
                    variant="underlined" type="number" step="1" min="1" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="預留名額" v-model.number="reserved" clearable density="compact" :rules="reservedRules"
                    variant="underlined" type="number" step="1" min="1" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="球費" v-model.number="fee" clearable density="compact" :rules="feeRules"
                    variant="underlined" type="number" step="1" min="0" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="場次開始時間" v-model="startTime" clearable density="compact" :rules="startTimeRules"
                    variant="underlined" type="time" />
            </v-col>
            <v-col :cols="12" :sm="6">
                <v-text-field label="場次結束時間" v-model="endTime" clearable density="compact" :rules="endTimeRules"
                    variant="underlined" type="time" />
            </v-col>
        </v-row>
    </v-container>
</template>