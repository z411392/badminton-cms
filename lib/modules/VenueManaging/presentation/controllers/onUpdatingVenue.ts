import { translateError } from "~/lib/utils/formatters"
import { showError, showSuccess } from "~/composables/utils/useSnackbar"

export type UpdatingVenue = {
    name: string
    address: string
    building: string
    floor: number
    latitude: number
    longitude: number
}

export const onUpdatingVenue = async (venueId: string, data: UpdatingVenue) => {
    const axios = unref(useNuxtApp().$axios)
    const uri = "/venues/:venueId".replace(":venueId", venueId)
    try {
        const {
            data: {
                payload: { venueId },
            },
        } = await axios.put<{ payload: { venueId: string } }>(uri, data)
        showSuccess(`更新了場地 ${venueId}`)
    } catch (thrown) {
        const error = translateError(thrown)
        if (error) showError(error.message)
    }
}
