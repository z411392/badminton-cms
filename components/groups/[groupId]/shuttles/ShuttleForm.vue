<script lang="ts" setup>
import { type Shuttle } from "~/lib/modules/ShuttleManaging/dtos/Shuttle"
import * as validators from "~/lib/modules/ShuttleManaging/presentation/validators/Shuttle"
import { onCreatingShuttle } from "~/lib/modules/ShuttleManaging/presentation/controllers/onCreatingShuttle"
import { onUpdatingShuttle } from "~/lib/modules/ShuttleManaging/presentation/controllers/onUpdatingShuttle"


const { reload } = defineProps<{ reload: Function }>()

const opened = ref(false)
const touched = ref(false)
const valid = ref(true)
const title = ref("")

const id = ref<string>()
const brand = ref<string>("")
const brandRules = [
    (value: string) => {
        const { error } = validators.brand.validate(value)
        if (error) return error.message
        return true
    },
]

const name = ref<string>("")
const nameRules = [
    (value: string) => {
        const { error } = validators.name.validate(value)
        if (error) return error.message
        return true
    },
]

const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingShuttle(id.value, unref(mutation))
    else await onCreatingShuttle(unref(mutation))
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        name: name.value,
        brand: brand.value,
    }
})

const open = async (shuttle?: Shuttle) => {
    touched.value = false
    opened.value = true
    if (shuttle) {
        const copy = JSON.parse(JSON.stringify(shuttle)) as Shuttle
        title.value = "編輯用球"
        id.value = copy.id
        name.value = copy.name
        brand.value = copy.brand
    } else {
        title.value = "新增用球"
        id.value = undefined
        name.value = ""
        brand.value = ""
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
                                <v-text-field label="廠牌" v-model="brand" clearable counter variant="underlined"
                                    :rules="brandRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field label="型號" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
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