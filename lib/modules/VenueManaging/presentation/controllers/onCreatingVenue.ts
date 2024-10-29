import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type CreatingVenue = {
    name: string
    address: string
    building: string
    floor: number
    latitude: number
    longitude: number
}

export const onCreatingVenue = async (data: CreatingVenue) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/venues"
    try {
        const {
            data: {
                payload: { venueId },
            },
        } = await axios.post<{ payload: { venueId: string } }>(uri, data)
        showSuccess(`新增了場地 ${venueId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
