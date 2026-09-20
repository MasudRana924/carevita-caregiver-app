/**
 * Shared form tokens — match Login screen inputs & primary buttons.
 */
export const FORM = {
  teal: '#0B8A80',
  title: '#0E2A24',
  muted: '#6F7F8C',
  button: '#0B5F4E',
  page: '#FFFFFF',
  border: '#E3EDE8',
  placeholder: '#B0BAC4',
  icon: '#8A97A6',
  danger: '#DC2626',
  dangerBorder: '#F0B4B0',
};

export const formStyles = {
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: FORM.title,
    marginBottom: 8,
  },
  inputRow: {
    height: 54,
    borderRadius: 27,
    backgroundColor: FORM.page,
    borderWidth: 1,
    borderColor: FORM.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  inputRowMultiline: {
    height: undefined,
    minHeight: 110,
    borderRadius: 20,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: FORM.title,
    paddingVertical: 0,
  },
  inputMultiline: {
    height: undefined,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: FORM.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9BB8B0',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  outlineButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: FORM.page,
    borderWidth: 1.5,
    borderColor: FORM.dangerBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: FORM.danger,
  },
  ghostButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F6F6F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: FORM.title,
  },
};
