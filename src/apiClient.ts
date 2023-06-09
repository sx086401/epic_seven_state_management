import { StateValues } from 'features/states/types'
import { camelizeKeys, decamelizeKeys } from 'humps'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { findIndex } from 'lodash'

const API_URL = process.env.REACT_APP_API_URL

const objToQueryStr = (params?: object) =>
  params
    ? '?' +
      Object.keys(params || {})
        .filter((key) => params![key as keyof typeof params] !== undefined)
        .map((key) => `${key}=${encodeURIComponent(params![key as keyof typeof params])}`)
        .join('&')
    : ''

export const statesApi = createApi({
  reducerPath: 'state',
  refetchOnMountOrArgChange: true,
  tagTypes: ['states'],
  baseQuery: fetchBaseQuery({ baseUrl: `http://${API_URL}/api/` }),
  endpoints: (builder) => ({
    getStates: builder.query<StateValues[], object>({
      query: (params) => `states${objToQueryStr(params)}`,
      transformResponse: (resp: any[]): StateValues[] =>
        resp.map((data) => camelizeKeys(data) as StateValues),
      providesTags: (result = []) => result?.map((state) => ({ type: 'states', id: state.id })),
    }),
    updateState: builder.mutation<StateValues, Partial<StateValues>>({
      query: (body) => ({
        url: `states/${body.id}/update`,
        method: 'PUT',
        body: decamelizeKeys(body),
      }),
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        const { data: newData } = await queryFulfilled

        dispatch(
          statesApi.util.updateQueryData('getStates', {}, (originData) => {
            const index = findIndex(originData, { id: body.id })
            originData.splice(index, 1, camelizeKeys(newData) as StateValues)
          })
        )
      },
      // invalidatesTags: (result) => [{ type: 'states', id: result?.id }],
    }),
  }),
})
