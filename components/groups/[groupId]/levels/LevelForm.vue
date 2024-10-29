<script lang="ts" setup>
import { type Level } from "~/lib/modules/LevelManaging/dtos/Level"
import * as validators from "~/lib/modules/LevelManaging/presentation/validators/Level"
import { color as colorValidator } from "~/lib/utils/validators"
import { onCreatingLevel } from "~/lib/modules/LevelManaging/presentation/controllers/onCreatingLevel"
import { onUpdatingLevel } from "~/lib/modules/LevelManaging/presentation/controllers/onUpdatingLevel"

const { reload, groupId } = defineProps<{ reload: Function, groupId: string }>()

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

const description = ref<string>("")
const descriptionRules = [
    (value: string) => {
        const { error } = validators.description.validate(value)
        if (error) return error.message
        return true
    },
]

const color = ref<string>("")
const colorRules = [
    (value: string) => {
        const { error } = colorValidator.validate(value)
        if (error) return error.message
        return true
    },
]

const order = ref<string | number>("")
const orderRules = [
    (value: string | number) => {
        const { error } = validators.order.validate(typeof value === "string" ? Number(value) : value)
        if (error) return error.message
        return true
    },
]

const stopWatching = ref<Function>()
const loading = ref(false)

const onSaveButtonClicked = async () => {
    loading.value = true
    if (id.value) await onUpdatingLevel(groupId, id.value, unref(mutation))
    else await onCreatingLevel(groupId, unref(mutation))
    loading.value = false
    reload()
    close()
}

const mutation = computed(() => {
    return {
        order: Number(order.value),
        name: name.value,
        description: description.value,
        color: color.value,
    }
})

const open = async (level?: Level) => {
    touched.value = false
    opened.value = true
    if (level) {
        const copy = JSON.parse(JSON.stringify(level)) as Level
        title.value = "編輯分級"
        id.value = copy.id
        order.value = String(copy.order)
        name.value = copy.name
        description.value = copy.description
        color.value = copy.color
    } else {
        title.value = "新增分級"
        order.value = ""
        id.value = undefined
        name.value = ""
        description.value = ""
        color.value = ""
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
                                <v-text-field label="級別" v-model.number="order" clearable counter variant="underlined"
                                    :rules="orderRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field label="級別名稱" v-model="name" clearable counter variant="underlined"
                                    :rules="nameRules" />
                            </v-col>
                            <v-col cols="12">
                                <v-textarea label="分級說明" v-model="description" clearable counter variant="underlined"
                                    :rules="descriptionRules" :rows="4" />
                            </v-col>
                            <v-col cols="12">
                                <v-text-field label="顏色" v-model="color" clearable counter variant="underlined"
                                    :rules="colorRules" />
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