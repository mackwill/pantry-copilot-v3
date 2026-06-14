import {
  PANTRY_CATEGORIES,
  PANTRY_LOCATIONS,
  PANTRY_UNITS,
  type PantryCategory,
  type PantryLocation,
  type PantryUnit,
} from '@pantry/contracts';
import { Field, Input } from '@pantry/design-system/web';
import type { ChangeEvent } from 'react';
import { categoryLabels, locationLabels, unitLabels } from '../../pantry-shared/labels';
import styles from '../ingredient-form.module.css';
import { ingredientStrings } from '../strings';
import type { IngredientField, IngredientFormValues } from '../useIngredientForm';

const f = ingredientStrings.fields;

interface IngredientFieldsProps {
  values: IngredientFormValues;
  setField: <K extends IngredientField>(field: K, value: IngredientFormValues[K]) => void;
}

interface EnumSelectProps<T extends string> {
  label: string;
  name: string;
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}

function EnumSelect<T extends string>({
  label,
  name,
  value,
  options,
  labels,
  onChange,
}: EnumSelectProps<T>) {
  const handle = (event: ChangeEvent<HTMLSelectElement>): void => {
    onChange(event.target.value as T);
  };
  return (
    <Field label={label}>
      <select
        className={`${styles['control'] ?? ''} ${styles['select'] ?? ''}`}
        name={name}
        value={value}
        onChange={handle}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function IngredientFields({ values, setField }: IngredientFieldsProps) {
  return (
    <div className={styles['fieldGrid']}>
      <Field label={f.name}>
        <Input
          name="name"
          value={values.name}
          onChange={(v) => {
            setField('name', v);
          }}
        />
      </Field>
      <Field label={f.brand}>
        <Input
          name="brand"
          value={values.brand}
          onChange={(v) => {
            setField('brand', v);
          }}
        />
      </Field>
      <Field label={f.quantity}>
        <Input
          name="quantity"
          type="text"
          value={values.quantity}
          onChange={(v) => {
            setField('quantity', v);
          }}
        />
      </Field>
      <EnumSelect<PantryUnit>
        label={f.unit}
        name="unit"
        value={values.unit}
        options={PANTRY_UNITS}
        labels={unitLabels}
        onChange={(v) => {
          setField('unit', v);
        }}
      />
      <EnumSelect<PantryCategory>
        label={f.category}
        name="category"
        value={values.category}
        options={PANTRY_CATEGORIES}
        labels={categoryLabels}
        onChange={(v) => {
          setField('category', v);
        }}
      />
      <EnumSelect<PantryLocation>
        label={f.location}
        name="location"
        value={values.location}
        options={PANTRY_LOCATIONS}
        labels={locationLabels}
        onChange={(v) => {
          setField('location', v);
        }}
      />
      <Field label={f.purchased}>
        <Input
          name="purchasedAt"
          type="text"
          value={values.purchasedAt}
          placeholder="YYYY-MM-DD"
          onChange={(v) => {
            setField('purchasedAt', v);
          }}
        />
      </Field>
      <Field label={f.bestBy}>
        <Input
          name="bestBy"
          type="text"
          value={values.bestBy}
          placeholder="YYYY-MM-DD"
          onChange={(v) => {
            setField('bestBy', v);
          }}
        />
      </Field>
      <Field label={f.notes} style={{ gridColumn: 'span 2' }}>
        <textarea
          className={`${styles['control'] ?? ''} ${styles['textarea'] ?? ''}`}
          name="notes"
          value={values.notes}
          onChange={(event) => {
            setField('notes', event.target.value);
          }}
        />
      </Field>
    </div>
  );
}
