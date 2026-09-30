package domain

import (
	"errors"
	"strings"
	"testing"
)

func TestUpdateProfileParamsValidate(t *testing.T) {
	cases := []struct {
		name    string
		input   string
		want    string
		wantErr bool
	}{
		{name: "trims surrounding space", input: "  Budi  ", want: "Budi"},
		{name: "empty", input: "", wantErr: true},
		{name: "only spaces", input: "   ", wantErr: true},
		{name: "at the limit", input: strings.Repeat("a", MaxNameLength), want: strings.Repeat("a", MaxNameLength)},
		{name: "over the limit", input: strings.Repeat("a", MaxNameLength+1), wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			params := UpdateProfileParams{Name: tc.input}
			err := params.Validate()

			if tc.wantErr {
				var validationErr *ValidationError
				if !errors.As(err, &validationErr) {
					t.Fatalf("err = %v, want a ValidationError", err)
				}
				return
			}
			if err != nil {
				t.Fatalf("Validate: %v", err)
			}
			if params.Name != tc.want {
				t.Errorf("Name = %q, want %q", params.Name, tc.want)
			}
		})
	}
}

func TestChangePasswordParamsValidate(t *testing.T) {
	cases := []struct {
		name    string
		current string
		next    string
		wantErr bool
	}{
		{name: "valid", current: "rahasia123", next: "rahasia456"},
		{name: "missing current password", current: "", next: "rahasia456", wantErr: true},
		{name: "new password too short", current: "rahasia123", next: "pendek", wantErr: true},
		{name: "new password too long", current: "rahasia123", next: strings.Repeat("a", MaxPasswordLength+1), wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			params := ChangePasswordParams{CurrentPassword: tc.current, NewPassword: tc.next}
			err := params.Validate()

			if !tc.wantErr {
				if err != nil {
					t.Fatalf("Validate: %v", err)
				}
				return
			}
			var validationErr *ValidationError
			if !errors.As(err, &validationErr) {
				t.Fatalf("err = %v, want a ValidationError", err)
			}
		})
	}
}

func TestDeleteAccountParamsValidate(t *testing.T) {
	if err := (&DeleteAccountParams{Password: "rahasia123"}).Validate(); err != nil {
		t.Errorf("Validate: %v", err)
	}

	err := (&DeleteAccountParams{}).Validate()
	var validationErr *ValidationError
	if !errors.As(err, &validationErr) {
		t.Errorf("err = %v, want a ValidationError", err)
	}
}
