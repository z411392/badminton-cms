<script lang="ts" setup>
import { type Venue } from "~/lib/modules/VenueManaging/dtos/Venue"
import * as validators from "~/lib/modules/VenueManaging/presentation/validators/Venue"
import { onCreatingVenue } from "~/lib/modules/VenueManaging/presentation/controllers/onCreatingVenue"
import { onUpdatingVenue } from "~/lib/modules/VenueManaging/presentation/controllers/onUpdatingVenue"


const { reload } = defineProps<{ reload: Function }>()

const opened = ref(false)
const touched = ref(false)
const valid = ref(true)
const title = ref("")

const id = ref<string>()
const name = ref<string>("")
const nameRules = [
    (value: string) => {
        const { error } = validators.name.validate(value)
        if (error) return error.message
        return true
    },
]
const address = ref<string>("")
const addressRules = [
    (value: string) => {
        const { error } = validators.address.validate(value)
        if (error) return error.message
        return true
    },
]
const building = ref<string>("")
const buildingRules = [
    (value: string) => {
        const { error } = validators.building.validate(value)
        if (error) return error.message
        return true
    },
]
const floor = ref<string | number>(1)
const floorRules = [
    (value: string | number) => {
        const { error } = validators.floor.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]
const latitude = ref<string>("0")
const latitudeRules = [
    (value: string) => {
        const { error } = validators.latitude.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]
const longitude = ref<string>("0")
const longitudeRules = [
    (value: string) => {
        const { error } = validators.longitude.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]

const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingVenue(id.value, unref(mutation))
    else await onCreatingVenue(unref(mutation))
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        name: name.value,
        address: address.value,
        building: building.value,
        floor: Number(floor.value),
        latitude: Number(latitude.value),
        longitude: Number(longitude.value),
    }
})

const open = async (venue?: Venue) => {
    touched.value = false
    opened.value = true
    if (venue) {
        const copy = JSON.parse(JSON.stringify(venue)) as Venue
        title.value = "編輯場地"
        id.value = copy.id
        name.value = copy.name
        address.value = copy.address
        building.value = copy.building
        floor.value = String(copy.floor)
        latitude.value = String(copy.latitude)
        longitude.value = String(copy.longitude)
    } else {
        title.value = "新增場地"
        id.value = undefined
        name.value = ""
        address.value = ""
        building.value = ""
        floor.value = String(1)
        latitude.value = String(0)
        longitude.value = String(0)
    }
    stopWatching.value = watch(mutation, () => touched.value = true, { deep: true })
}

const close = () => {
    opened.value = false
    stopWatching.value?.()
    
}

onBeforeUnmount(() => close())

defineExpose({
    open,
})
</script>

<template>
    <v-dialog width="auto" v-model="opened" :persistent="touched" :width="320">
        <v-card :loading="loading">
            <v-card-title>
                {{ title }}
            </v-card-title>
            <v-card-text>
                <v-form v-model="valid" @submit.prevent="">
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field label="地點" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea label="地址" v-model="address" clearable counter variant="underlined"
                                    :rules="addressRules" :rows="4" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field label="樓館名稱" v-model="building" clearable counter variant="underlined"
                                    :rules="buildingRules" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field label="樓層" v-model="floor" clearable counter variant="underlined"
                                    type="number" :step="1" :rules="floorRules" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field label="經度" v-model="longitude" clearable variant="underlined"
                                    type="number" suffix="°E" :rules="longitudeRules" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field label="緯度" v-model="latitude" clearable variant="underlined" type="number"
                                    suffix="°N" :rules="latitudeRules" />
                            </v-col>
                        </v-row>
                    </v-container>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text="取消" @click="close" :disabled="loading" />
                <v-btn text="儲存" @click="onSaveButtonClicked" :disabled="!valid || !touched" :loading="loading" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>