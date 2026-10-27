"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useStoreData } from "@/lib/store/store-data";
import { useStaff } from "@/lib/admin/staff-context";
import { useCatalog } from "@/lib/use-catalog";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { cn, formatCents } from "@/lib/format";
import { ProductImage } from "@/components/ui/product-image";
import { Switch } from "@/components/ui/switch";
import { Sheet } from "@/components/ui/sheet";
import { buttonClasses } from "@/components/ui/button";
import { archiveProductAction, createProductAction, saveProductOptionsAction, setAvailabilityAction, updateProductAction } from "@/app/admin/actions";
import { toEditable, type EditableGroup } from "@/lib/menu/option-editor";
import { OptionGroupsEditor } from "./option-groups-editor";

export function MenuManager() {
  const { products } = useCatalog();
  const categories = useStoreData((s) => s.categories);
  const availability = useStoreData((s) => s.availability);
  const setAvailableLocal = useStoreData((s) => s.setAvailableLocal);
  const staff = useStaff();
  const isManager = staff.role === "manager";
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const soldOutCount = products.filter((p) => availability[p.id] === false).length;

  async function toggle(product: Product, available: boolean) {
    setAvailableLocal(product.id, available); // feels instant; reverted below if it fails
    const result = await setAvailabilityAction(product.id, available);
    if (!result.ok) {
      setAvailableLocal(product.id, !available);
      toast(`Couldn't update ${product.name}: ${result.error}`);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-navy">Menu</h1>
          <p className="mt-1 text-ink-muted">
            Changes show up on the customer site right away.{soldOutCount > 0 && ` ${soldOutCount} sold out.`}
          </p>
        </div>
        {isManager && (
          <button type="button" onClick={() => setEditing("new")} className={buttonClasses("primary", "md")}>
            <Plus className="size-4" /> Add item
          </button>
        )}
      </div>

      <div className="mt-8 space-y-10">
        {categories.map((category) => {
          const items = products.filter((p) => p.categoryId === category.id);
          if (items.length === 0) return null;
          return (
            <section key={category.id} aria-labelledby={`admin-${category.id}`}>
              <h2 id={`admin-${category.id}`} className="eyebrow text-ink-muted">
                {category.name}
              </h2>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                {items.map((product) => {
                  const available = availability[product.id] !== false;
                  return (
                    <li key={product.id} className="flex items-center gap-4 px-4 py-3">
                      <ProductImage
                        image={product.image}
                        name={product.name}
                        categoryId={product.categoryId}
                        sizes="48px"
                        dimmed={!available}
                        className="size-12 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold leading-snug", !available && "text-ink-muted")}>{product.name}</p>
                        <p className="text-sm text-ink-muted tabular-nums">
                          {product.priceCents > 0 ? formatCents(product.priceCents) : "No price set"}
                          {product.optionGroups.length > 0 && " · Has options"}
                        </p>
                      </div>
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          className="press grid size-11 place-items-center rounded-full text-navy hover:bg-navy/[0.06]"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                      <label className="flex items-center gap-2.5">
                        <span className={cn("hidden w-16 text-right text-sm font-semibold sm:block", available ? "text-[#1f6b41]" : "text-ink-muted")}>
                          {available ? "In stock" : "Sold out"}
                        </span>
                        <Switch checked={available} onCheckedChange={(on) => toggle(product, on)} label={`${product.name} available`} />
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Sheet
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Add a menu item" : `Edit ${editing?.name ?? ""}`}
        large
      >
        {editing && (
          <EditForm
            key={editing === "new" ? "new" : editing.id}
            product={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function EditForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const categories = useStoreData((s) => s.categories);
  const allProducts = useStoreData((s) => s.products);
  const [initialGroups] = useState<EditableGroup[]>(() => (product?.optionGroups ?? []).map(toEditable));
  const [groups, setGroups] = useState<EditableGroup[]>(initialGroups);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toFixed(2) : "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [popular, setPopular] = useState(product?.popular ?? false);
  const [image, setImage] = useState<{ url: string; alt: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    if (file.size > 5 * 1024 * 1024) return setError("Photos must be under 5 MB.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP photo.");
    setUploading(true);
    setError(null);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${product?.id ?? "new"}-${Date.now()}.${ext}`;
    // Storage policies only let managers upload to this bucket.
    const { error: uploadError } = await supabase.storage.from("menu-images").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) return setError(`Upload failed: ${uploadError.message}`);
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setImage({ url: data.publicUrl, alt: name || product?.name || "Menu item" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price) * 100);
    if (!name.trim()) return setError("Name can't be empty.");
    if (!Number.isFinite(cents) || cents < 0 || cents > 10000) return setError("Enter a price between $0 and $100.");
    setSaving(true);
    const input = {
      name,
      description,
      priceCents: cents,
      categoryId,
      popular,
      ...(image ? { imageUrl: image.url, imageAlt: name } : {}),
    };
    const result = product ? await updateProductAction(product.id, input) : await createProductAction(input);
    if (!result.ok) {
      setSaving(false);
      return setError(result.error);
    }
    // Save the choices (bread, flavors, add-ons…) if they changed.
    const productId = product?.id ?? result.id;
    if (productId && JSON.stringify(groups) !== JSON.stringify(initialGroups)) {
      const optionsResult = await saveProductOptionsAction(productId, groups);
      if (!optionsResult.ok) {
        setSaving(false);
        return setError(product ? optionsResult.error : `${name} was added, but its choices weren't saved: ${optionsResult.error}`);
      }
    }
    setSaving(false);
    toast(product ? "Saved" : `${name} added to the menu`);
    onDone();
  }

  async function remove() {
    if (!product || !window.confirm(`Remove ${product.name} from the menu? Past orders aren't affected.`)) return;
    const result = await archiveProductAction(product.id);
    if (!result.ok) return setError(result.error);
    toast(`${product.name} removed`);
    onDone();
  }

  const input = "mt-2 block h-12 w-full rounded-xl border border-line bg-white px-4 text-base font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";
  const previewImage = image ? { src: image.url, alt: image.alt, isPlaceholder: false } : (product?.image ?? null);

  return (
    <form onSubmit={save} className="space-y-5 pt-2 pb-6">
      <div className="flex items-center gap-4">
        <ProductImage
          image={previewImage}
          name={name || "New item"}
          categoryId={categoryId}
          sizes="96px"
          className="size-24 shrink-0 rounded-2xl"
        />
        <label className={buttonClasses("secondary", "md", "cursor-pointer")}>
          <ImagePlus className="size-4" />
          {uploading ? "Uploading…" : previewImage ? "Change photo" : "Add photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={input} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Price
          <span className="relative block">
            <span className="pointer-events-none absolute top-1/2 left-4 mt-1 -translate-y-1/2 font-normal text-ink-muted">$</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0.00" className={cn(input, "pl-8 tabular-nums")} />
          </span>
        </label>
        <label className="block text-sm font-semibold">
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={input}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={200}
          className={cn(input, "h-auto resize-none py-3")}
        />
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" checked={popular} onChange={(e) => setPopular(e.target.checked)} className="size-5 accent-[#0a3473]" />
        Show in “Campus favorites” on the homepage
      </label>
      <div className="border-t border-line pt-5">
        <OptionGroupsEditor value={groups} onChange={setGroups} products={allProducts} currentProductId={product?.id} />
      </div>
      {error && (
        <p className="text-sm font-medium text-[#a3361f]" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving || uploading} className={buttonClasses("primary", "lg", "flex-1")}>
          {saving ? "Saving…" : product ? "Save changes" : "Add to menu"}
        </button>
        <button type="button" onClick={onDone} className={buttonClasses("secondary", "lg")}>
          Cancel
        </button>
      </div>
      {product && (
        <button type="button" onClick={remove} className="text-sm font-semibold text-[#a3361f] hover:underline">
          Remove from menu
        </button>
      )}
    </form>
  );
}
